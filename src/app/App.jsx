import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  Grid2X2,
  LayoutDashboard,
  Plus,
  Settings,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { Topbar } from '../components/layout/Topbar.jsx';
import { Toasts } from '../components/ui/Toasts.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { DashboardView } from '../features/dashboard/DashboardView.jsx';
import { TransactionsView } from '../features/transactions/TransactionsView.jsx';
import { CategoriesView } from '../features/categories/CategoriesView.jsx';
import { AssetsView } from '../features/assets/AssetsView.jsx';
import { InvestmentsView } from '../features/investments/InvestmentsView.jsx';
import { GrowthView } from '../features/growth/GrowthView.jsx';
import { SettingsView } from '../features/settings/SettingsView.jsx';
import { EntityForm } from '../features/forms/EntityForm.jsx';
import { INITIAL_STATE } from '../lib/constants.js';
import { clearState, loadState, saveState } from '../lib/storage.js';
import { createDemoState } from '../lib/sampleData.js';
import { filterTransactions } from '../lib/finance.js';
import { uid } from '../lib/formatters.js';
import {
  fetchGoogleUser,
  getGoogleAccessToken,
  logoutGoogle,
  readGoogleTokenFromRedirect,
  redirectToGoogleOAuth,
} from '../lib/authApi.js';
import {
  exportStateToExcel,
  exportStateToExcelBuffer,
  exportStateToSpreadsheetRows,
  importStateFromExcel,
  importStateFromExcelBuffer,
} from '../lib/excel.js';

const nav = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Core' },
  { key: 'transactions', label: 'Transactions', icon: WalletCards, group: 'Core' },
  { key: 'categories', label: 'Categories', icon: Grid2X2, group: 'Core' },
  { key: 'assets', label: 'Assets', icon: Building2, group: 'Wealth' },
  { key: 'investments', label: 'Investments', icon: TrendingUp, group: 'Wealth' },
  { key: 'growth', label: 'Growth', icon: BarChart3, group: 'Wealth' },
  { key: 'settings', label: 'Settings', icon: Settings, group: 'System' },
];

const titles = {
  dashboard: ['Dashboard', "Welcome back - here's your financial overview"],
  transactions: ['Transactions', 'View, filter, and manage every entry'],
  categories: ['Categories', 'Organize income and spending categories'],
  assets: ['Assets', 'Track cash, accounts, property and more'],
  investments: ['Investments', 'Manage holdings and returns'],
  growth: ['Growth', 'Wealth analytics and monthly snapshots'],
  settings: ['Settings', 'Customize the app and manage your data'],
};

export function App() {
  const [data, setData] = useState(() => loadState());
  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [filters, setFilters] = useState({ search: '', type: '', category: '', from: '', to: '' });
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [googleUser, setGoogleUser] = useState(null);

  useEffect(() => saveState(data), [data]);

  useEffect(() => {
    document.body.dataset.theme = data.settings.theme;
    document.body.dataset.accent = data.settings.accent;
  }, [data.settings]);

  useEffect(() => {
    const accessToken = readGoogleTokenFromRedirect();
    if (!accessToken) return;

    fetchGoogleUser(accessToken)
      .then((user) => {
        setGoogleUser(user);
        if (user?.name) {
          const id = uid('toast');
          setToasts((items) => [...items, { id, message: `Signed in as ${user.name}`, kind: 'success' }]);
          window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 2600);
        }
      })
      .catch((error) => {
        const id = uid('toast');
        setToasts((items) => [...items, { id, message: error.message, kind: 'error' }]);
        window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 2600);
      });
  }, []);

  const context = useMemo(
    () => ({
      data,
      setData,
      currency: data.settings.currency,
      notify: (message, kind = 'success') => {
        const id = uid('toast');
        setToasts((items) => [...items, { id, message, kind }]);
        window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 2600);
      },
      openModal: setModal,
    }),
    [data],
  );

  const filteredTransactions = useMemo(
    () => filterTransactions(data.transactions, data.categories, filters, globalSearch),
    [data.transactions, data.categories, filters, globalSearch],
  );

  function upsert(collection, entity, prefix) {
    setData((current) => {
      const exists = entity.id && current[collection].some((item) => item.id === entity.id);
      const nextItem = exists ? entity : { ...entity, id: uid(prefix), createdAt: Date.now() };
      return {
        ...current,
        [collection]: exists
          ? current[collection].map((item) => (item.id === entity.id ? nextItem : item))
          : [...current[collection], nextItem],
      };
    });
  }

  function remove(collection, id) {
    const key = collection === 'snapshots' ? 'month' : 'id';
    setData((current) => ({ ...current, [collection]: current[collection].filter((item) => item[key] !== id) }));
  }

  function confirmDelete(title, message, onConfirm) {
    setModal({ kind: 'confirm', title, message, onConfirm });
  }

  function exportData() {
    exportStateToExcel(data);
    context.notify('Excel exported');
  }

  async function importData(file) {
    if (!file) return;
    try {
      const imported = await importStateFromExcel(file);
      setData({
        ...INITIAL_STATE,
        ...imported,
        importSource: {
          method: 'file',
          link: file.name || '',
          fileId: '',
          importedAt: new Date().toISOString(),
        },
        settings: { ...INITIAL_STATE.settings, ...(imported.settings || {}) },
      });
      context.notify('Excel imported');
    } catch (error) {
      context.notify(`Import failed: ${error.message}`, 'error');
    }
  }

  async function importDataFromUrl(url) {
    const importSource = normalizeExcelImportUrl(url);
    if (!importSource) {
      context.notify('Enter an Excel file link', 'error');
      return;
    }

    try {
      const response = await fetch(importSource.downloadUrl);
      if (!response.ok) throw new Error(`Download failed (${response.status})`);

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('The link returned a web page, not an Excel file');
      }

      const imported = importStateFromExcelBuffer(await response.arrayBuffer());
      setData({
        ...INITIAL_STATE,
        ...imported,
        importSource: {
          method: 'link',
          link: importSource.originalUrl,
          downloadUrl: importSource.downloadUrl,
          provider: importSource.provider,
          fileId: importSource.fileId || '',
          importedAt: new Date().toISOString(),
        },
        settings: { ...INITIAL_STATE.settings, ...(imported.settings || {}) },
      });
      context.notify('Excel imported from link');
    } catch (error) {
      context.notify(`Import failed: ${error.message}`, 'error');
    }
  }

  async function saveImportedLink() {
    if (data.importSource?.method !== 'link') {
      context.notify('Import from a link before saving back', 'error');
      return;
    }

    try {
      await overwriteImportedLink(data);
      setData((current) => ({
        ...current,
        importSource: { ...current.importSource, savedAt: new Date().toISOString() },
      }));
      context.notify('Saved to imported link');
    } catch (error) {
      context.notify(`Save failed: ${error.message}`, 'error');
    }
  }

  const title = titles[view];

  return (
    <>
      <div className="app-shell">
        <Sidebar
          nav={nav}
          view={view}
          open={sidebarOpen}
          settings={data.settings}
          onNavigate={(next) => {
            setView(next);
            setSidebarOpen(false);
          }}
          onSettings={(settings) => setData((current) => ({ ...current, settings: { ...current.settings, ...settings } }))}
        />
        <button
          aria-label="Close navigation"
          className={`scrim ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
        <div className="main-shell">
          <Topbar
            title={title[0]}
            subtitle={title[1]}
            search={globalSearch}
            onSearch={(value) => {
              setGlobalSearch(value);
              setView('transactions');
            }}
            onMenu={() => setSidebarOpen(true)}
            onAdd={() => setModal({ kind: 'transaction' })}
          />
          <main className="content">
            {view === 'dashboard' && (
              <DashboardView
                {...context}
                goTo={setView}
                onAdd={() => setModal({ kind: 'transaction' })}
                onSaveImportSource={saveImportedLink}
              />
            )}
            {view === 'transactions' && (
              <TransactionsView
                {...context}
                filters={filters}
                setFilters={setFilters}
                transactions={filteredTransactions}
                onAdd={() => setModal({ kind: 'transaction' })}
                onEdit={(item) => setModal({ kind: 'transaction', item })}
                onDelete={(item) => confirmDelete('Delete transaction?', `"${item.description}" will be removed.`, () => remove('transactions', item.id))}
              />
            )}
            {view === 'categories' && (
              <CategoriesView
                {...context}
                onAdd={() => setModal({ kind: 'category' })}
                onEdit={(item) => setModal({ kind: 'category', item })}
                onDelete={(item) => confirmDelete('Delete category?', `"${item.name}" will be removed.`, () => remove('categories', item.id))}
              />
            )}
            {view === 'assets' && (
              <AssetsView
                {...context}
                onAdd={() => setModal({ kind: 'asset' })}
                onEdit={(item) => setModal({ kind: 'asset', item })}
                onDelete={(item) => confirmDelete('Delete asset?', `"${item.name}" will be removed.`, () => remove('assets', item.id))}
              />
            )}
            {view === 'investments' && (
              <InvestmentsView
                {...context}
                onAdd={() => setModal({ kind: 'investment' })}
                onEdit={(item) => setModal({ kind: 'investment', item })}
                onDelete={(item) => confirmDelete('Delete investment?', `"${item.name}" will be removed.`, () => remove('investments', item.id))}
              />
            )}
            {view === 'growth' && (
              <GrowthView
                {...context}
                onAdd={() => setModal({ kind: 'snapshot' })}
                onEdit={(item) => setModal({ kind: 'snapshot', item })}
                onDelete={(item) => confirmDelete('Delete snapshot?', `${item.month} will be removed.`, () => remove('snapshots', item.month))}
              />
            )}
            {view === 'settings' && (
              <SettingsView
                {...context}
                onSettings={(settings) => setData((current) => ({ ...current, settings: { ...current.settings, ...settings } }))}
                googleUser={googleUser}
                onGoogleOAuth={redirectToGoogleOAuth}
                onGoogleLogout={async () => {
                  await logoutGoogle();
                  setGoogleUser(null);
                  context.notify('Signed out of Google');
                }}
                onExport={exportData}
                onImport={importData}
                onImportUrl={importDataFromUrl}
                onReset={() =>
                  confirmDelete('Reset all data?', 'All local data will be replaced with demo data.', () => {
                    clearState();
                    setData(createDemoState());
                  })
                }
              />
            )}
          </main>
        </div>
      </div>

      {modal?.kind !== 'confirm' && modal && (
        <EntityForm
          modal={modal}
          data={data}
          currency={data.settings.currency}
          onClose={() => setModal(null)}
          onSave={(collection, item, prefix) => {
            if (collection === 'snapshots') {
              setData((current) => ({
                ...current,
                snapshots: [
                  ...current.snapshots.filter((snapshot) => snapshot.month !== (modal.item?.month || item.month)),
                  item,
                ].sort((a, b) => a.month.localeCompare(b.month)),
              }));
            } else {
              upsert(collection, item, prefix);
            }
            setModal(null);
            context.notify('Saved');
          }}
        />
      )}

      {modal?.kind === 'confirm' && (
        <Modal title={modal.title} onClose={() => setModal(null)}>
          <p className="confirm-message">{modal.message}</p>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button
              className="btn btn-danger"
              onClick={() => {
                modal.onConfirm();
                setModal(null);
                context.notify('Deleted');
              }}
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
      <Toasts items={toasts} />
    </>
  );
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

async function overwriteImportedLink(state) {
  const source = state.importSource;

  if (source.provider === 'google_sheets') {
    await overwriteGoogleSpreadsheet(source.fileId, state);
    return;
  }

  const workbookBytes = exportStateToExcelBuffer(state);

  if (source.provider === 'google_drive') {
    await overwriteGoogleDriveFile(source.fileId, workbookBytes);
    return;
  }

  await overwriteUrl(source.link, workbookBytes);
}

async function overwriteGoogleSpreadsheet(spreadsheetId, state) {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Sign in with Google before saving to Sheets');

  const sheets = exportStateToSpreadsheetRows(state);
  const metadataResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties.title`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!metadataResponse.ok) {
    await throwGoogleApiError(metadataResponse, 'Google Sheets metadata');
  }

  const metadata = await metadataResponse.json();
  const existingTitles = new Set((metadata.sheets || []).map((sheet) => sheet.properties?.title).filter(Boolean));
  const missingSheets = sheets.filter((sheet) => !existingTitles.has(sheet.name));

  if (missingSheets.length > 0) {
    const addResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: missingSheets.map((sheet) => ({ addSheet: { properties: { title: sheet.name } } })),
        }),
      },
    );

    if (!addResponse.ok) {
      await throwGoogleApiError(addResponse, 'Google Sheets add sheet');
    }
  }

  const clearResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchClear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ranges: sheets.map((sheet) => quoteSheetRange(sheet.name)),
      }),
    },
  );

  if (!clearResponse.ok) {
    await throwGoogleApiError(clearResponse, 'Google Sheets clear');
  }

  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: sheets.map((sheet) => ({
          range: `${quoteSheetName(sheet.name)}!A1`,
          values: sheet.values,
        })),
      }),
    },
  );

  if (!updateResponse.ok) {
    await throwGoogleApiError(updateResponse, 'Google Sheets update');
  }
}

async function throwGoogleApiError(response, action) {
  let detail = '';

  try {
    const payload = await response.json();
    detail = payload.error?.message || payload.error_description || '';
  } catch {
    detail = await response.text().catch(() => '');
  }

  if (response.status === 403) {
    throw new Error(
      `${action} failed: Google denied access. Reconnect Google and make sure the account can edit this Sheet and the backend OAuth includes the spreadsheets scope.`,
    );
  }

  if (response.status === 401) {
    throw new Error(`${action} failed: Google session expired. Sign in with Google again.`);
  }

  throw new Error(`${action} failed (${response.status})${detail ? `: ${detail}` : ''}`);
}

function quoteSheetName(name) {
  return `'${name.replaceAll("'", "''")}'`;
}

function quoteSheetRange(name) {
  return quoteSheetName(name);
}

async function overwriteGoogleDriveFile(fileId, workbookBytes) {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Sign in with Google before saving to Drive');

  const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    body: workbookBytes,
  });

  if (!response.ok) {
    throw new Error(`Google Drive rejected the overwrite (${response.status})`);
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
