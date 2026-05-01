import { API_BASE_URL, getGoogleAccessToken } from '../../lib/authApi.js';
import {
  exportStateToExcel,
  exportStateToExcelBuffer,
  exportStateToSpreadsheetRows,
  importStateFromExcel,
  importStateFromExcelBuffer,
} from '../../lib/excel.js';
import { INITIAL_STATE } from '../../lib/constants.js';

export function exportDataToExcel(state) {
  exportStateToExcel(state);
}

export async function importDataFromFile(file) {
  if (!file) return null;
  const imported = await importStateFromExcel(file);

  return withImportSource(imported, {
    method: 'file',
    link: file.name || '',
    fileId: '',
    importedAt: new Date().toISOString(),
  });
}

export async function importDataFromUrl(url) {
  const importSource = normalizeExcelImportUrl(url);
  if (!importSource) throw new Error('Enter an Excel file link');

  const response = await fetch(importSource.downloadUrl);
  if (!response.ok) throw new Error(`Download failed (${response.status})`);

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error('The link returned a web page, not an Excel file');
  }

  const imported = importStateFromExcelBuffer(await response.arrayBuffer());
  return withImportSource(imported, {
    method: 'link',
    link: importSource.originalUrl,
    downloadUrl: importSource.downloadUrl,
    provider: importSource.provider,
    fileId: importSource.fileId || '',
    importedAt: new Date().toISOString(),
  });
}

export async function overwriteImportedLink(state) {
  const source = state.importSource;
  if (source?.method !== 'link') throw new Error('Import from a link before saving back');

  if (source.provider === 'google_sheets' || source.provider === 'google_drive') {
    await overwriteGoogleFile(source.fileId, state);
    return;
  }

  await overwriteUrl(source.link, exportStateToExcelBuffer(state));
}

function withImportSource(imported, importSource) {
  return {
    ...INITIAL_STATE,
    ...imported,
    importSource,
    settings: { ...INITIAL_STATE.settings, ...(imported.settings || {}) },
  };
}

function normalizeExcelImportUrl(value) {
  const rawUrl = value.trim();
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);

    if (url.hostname === 'drive.google.com') {
      const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
      const id = fileMatch?.[1] || url.searchParams.get('id');
      if (id) {
        return {
          originalUrl: rawUrl,
          downloadUrl: `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`,
          provider: 'google_drive',
          fileId: id,
        };
      }
    }

    if (url.hostname === 'docs.google.com' && url.pathname.includes('/spreadsheets/d/')) {
      const sheetMatch = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
      if (sheetMatch?.[1]) {
        return {
          originalUrl: rawUrl,
          downloadUrl: `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=xlsx`,
          provider: 'google_sheets',
          fileId: sheetMatch[1],
        };
      }
    }

    return {
      originalUrl: rawUrl,
      downloadUrl: url.toString(),
      provider: 'url',
      fileId: '',
    };
  } catch {
    return null;
  }
}

async function overwriteGoogleFile(fileId, state) {
  const token = getRequiredGoogleAccessToken();
  const metadata = await fetchGoogleDriveMetadata(fileId, token);

  if (metadata.is_google_sheet) {
    await overwriteGoogleSpreadsheet(fileId, state, token);
    return;
  }

  if (metadata.is_excel_file) {
    await overwriteGoogleDriveFile(fileId, exportStateToExcelBuffer(state), token);
    return;
  }

  throw new Error(`Unsupported Google file type: ${metadata.mime_type || 'unknown'}`);
}

async function fetchGoogleDriveMetadata(fileId, token) {
  const response = await fetch(apiUrl(`/auth/google/drive/files/${encodeURIComponent(fileId)}/metadata`), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Google Drive metadata failed (${response.status})${payload.detail ? `: ${payload.detail}` : ''}`);
  }

  return payload;
}

async function overwriteGoogleSpreadsheet(spreadsheetId, state, token = getRequiredGoogleAccessToken()) {
  const response = await fetch(apiUrl(`/auth/google/sheets/${encodeURIComponent(spreadsheetId)}/overwrite`), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      value_input_option: 'RAW',
      sheets: exportStateToSpreadsheetRows(state),
    }),
  });

  if (!response.ok) {
    throw new Error(`Backend rejected Google Sheets overwrite (${response.status})`);
  }
}

async function overwriteGoogleDriveFile(fileId, workbookBytes, token = getRequiredGoogleAccessToken()) {
  const response = await fetch(apiUrl(`/auth/google/drive/files/${encodeURIComponent(fileId)}`), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    body: workbookBytes,
  });

  if (!response.ok) {
    throw new Error(`Backend rejected Google Drive overwrite (${response.status})`);
  }
}

async function overwriteUrl(url, workbookBytes) {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    body: workbookBytes,
  });

  if (!response.ok) {
    throw new Error(`The link does not allow overwrite (${response.status})`);
  }
}

function getRequiredGoogleAccessToken() {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Sign in with Google before saving to Google Drive or Sheets');
  return token;
}

function apiUrl(path) {
  return new URL(path, API_BASE_URL).toString();
}
