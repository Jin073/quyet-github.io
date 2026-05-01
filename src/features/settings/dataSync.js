import { API_BASE_URL, getGoogleAccessToken } from '../../lib/authApi.js';
import {
  exportStateToExcel,
  exportStateToExcelBuffer,
  exportStateToSpreadsheetRows,
  importStateFromExcel,
  importStateFromExcelBuffer,
  importStateFromSpreadsheetValues,
} from '../../lib/excel.js';
import { INITIAL_STATE } from '../../lib/constants.js';

const GOOGLE_SHEET_NAMES = ['Transactions', 'Categories', 'Assets', 'Investments', 'Snapshots', 'Settings'];

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

  if (importSource.provider === 'google_sheets') {
    return importGoogleSpreadsheet(importSource, { preferPublic: true });
  }

  if (importSource.provider === 'google_drive') {
    return importGoogleDriveFile(importSource);
  }

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

async function importGoogleSpreadsheet(importSource, options = {}) {
  if (options.preferPublic) {
    const publicImport = await tryImportPublicExcelUrl(importSource);
    if (publicImport) return publicImport;
  }

  const token = getRequiredGoogleAccessToken('Sign in with Google before importing a private Google Sheet link');
  const params = new URLSearchParams({
    majorDimension: 'ROWS',
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });

  GOOGLE_SHEET_NAMES.forEach((name) => params.append('ranges', name));

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(importSource.fileId)}/values:batchGet?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = payload.error?.message || `Google Sheets import failed (${response.status})`;
    if (isOfficeFileSpreadsheetError(detail)) {
      return importGoogleDriveFile({ ...importSource, provider: 'google_drive' }, token);
    }
    throw new Error(detail);
  }

  const sheetValues = Object.fromEntries(
    (payload.valueRanges || []).map((range) => [range.range.split('!')[0].replace(/^'|'$/g, ''), range.values || []]),
  );
  const imported = importStateFromSpreadsheetValues(sheetValues);

  return withImportSource(imported, {
    method: 'link',
    link: importSource.originalUrl,
    provider: importSource.provider,
    fileId: importSource.fileId || '',
    importedAt: new Date().toISOString(),
  });
}

async function tryImportPublicExcelUrl(importSource) {
  try {
    const response = await fetch(importSource.downloadUrl);
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) return null;

    const imported = importStateFromExcelBuffer(await response.arrayBuffer());
    return withImportSource(imported, {
      method: 'link',
      link: importSource.originalUrl,
      downloadUrl: importSource.downloadUrl,
      provider: importSource.provider,
      fileId: importSource.fileId || '',
      importedAt: new Date().toISOString(),
    });
  } catch {
    return null;
  }
}

async function importGoogleDriveFile(importSource, token = getRequiredGoogleAccessToken('Sign in with Google before importing a private Google Drive file')) {
  const metadata = await fetchGoogleDriveFileMetadata(importSource.fileId, token);

  if (metadata.mimeType === 'application/vnd.google-apps.spreadsheet') {
    return importGoogleSpreadsheet({ ...importSource, provider: 'google_sheets' });
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(importSource.fileId)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const detail = await readGoogleApiError(response);
    throw new Error(detail || `Google Drive download failed (${response.status})`);
  }

  const imported = importStateFromExcelBuffer(await response.arrayBuffer());
  return withImportSource(imported, {
    method: 'link',
    link: importSource.originalUrl,
    provider: 'google_drive',
    fileId: importSource.fileId || '',
    importedAt: new Date().toISOString(),
  });
}

async function fetchGoogleDriveFileMetadata(fileId, token) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id%2Cname%2CmimeType`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const detail = await readGoogleApiError(response);
    throw new Error(detail || `Google Drive metadata failed (${response.status})`);
  }

  return response.json();
}

async function readGoogleApiError(response) {
  const payload = await response.clone().json().catch(() => null);
  return payload?.error?.message || payload?.error_description || response.statusText;
}

function isOfficeFileSpreadsheetError(message) {
  return /office file/i.test(message) || /not supported for this document/i.test(message);
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

function getRequiredGoogleAccessToken(message = 'Sign in with Google before saving to Google Drive or Sheets') {
  const token = getGoogleAccessToken();
  if (!token) throw new Error(message);
  return token;
}

function apiUrl(path) {
  return new URL(path, API_BASE_URL).toString();
}
