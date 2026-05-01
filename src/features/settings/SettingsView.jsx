import { useState } from 'react';
import { Chrome, Link } from 'lucide-react';
import { ACCENTS } from '../../lib/constants.js';

export function SettingsView({ data, googleUser, onSettings, onGoogleOAuth, onGoogleLogout, onExport, onImport, onImportUrl, onReset }) {
  const [importUrl, setImportUrl] = useState('');

  return (
    <div className="settings-grid">
      <section className="panel">
        <div className="panel-header"><div className="panel-title">Account</div></div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Google OAuth</div>
            <div className="setting-desc">{googleUser ? 'Signed in through the FastAPI backend' : 'Authenticate through the FastAPI backend'}</div>
          </div>
          {googleUser ? (
            <div className="account-chip">
              {googleUser.picture && <img src={googleUser.picture} alt="" className="account-avatar" referrerPolicy="no-referrer" />}
              <div className="account-copy">
                <strong>{googleUser.name || googleUser.email}</strong>
                {googleUser.email && <span>{googleUser.email}</span>}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={onGoogleLogout}>Logout</button>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={onGoogleOAuth}>
              <Chrome size={14} />
              Continue with Google
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header"><div className="panel-title">Appearance</div></div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Dark mode</div>
            <div className="setting-desc">Easier on the eyes at night</div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={data.settings.theme === 'dark'} onChange={(e) => onSettings({ theme: e.target.checked ? 'dark' : 'light' })} />
            <span className="slider" />
          </label>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Accent color</div>
            <div className="setting-desc">Personalize the dashboard</div>
          </div>
          <div className="theme-pills">
            {ACCENTS.map((accent) => (
              <button key={accent} className={`theme-pill ${data.settings.accent === accent ? 'active' : ''}`} data-color={accent} onClick={() => onSettings({ accent })} />
            ))}
          </div>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Currency symbol</div>
            <div className="setting-desc">Used across the app</div>
          </div>
          <select className="field compact" value={data.settings.currency} onChange={(e) => onSettings({ currency: e.target.value })}>
            <option value="$">$ USD</option>
            <option value="€">€ EUR</option>
            <option value="£">£ GBP</option>
            <option value="¥">¥ JPY</option>
            <option value="₫">₫ VND</option>
          </select>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header"><div className="panel-title">Data</div></div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Export data</div>
            <div className="setting-desc">Download an Excel workbook</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onExport}>Export</button>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Import data</div>
            <div className="setting-desc">Restore from Excel workbook</div>
          </div>
          <label className="btn btn-ghost btn-sm">
            Import
            <input hidden type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={(e) => onImport(e.target.files[0])} />
          </label>
        </div>
        <div className="setting-row import-link-row">
          <div>
            <div className="setting-label">Import from link</div>
            <div className="setting-desc">Use a public .xlsx, .xls, Google Drive, or Google Sheets link</div>
          </div>
          <form
            className="import-link-form"
            onSubmit={(event) => {
              event.preventDefault();
              onImportUrl(importUrl);
            }}
          >
            <input
              className="field import-link-input"
              type="url"
              placeholder="https://..."
              value={importUrl}
              onChange={(event) => setImportUrl(event.target.value)}
            />
            <button className="btn btn-ghost btn-sm" type="submit">
              <Link size={14} />
              Import
            </button>
          </form>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Reset all data</div>
            <div className="setting-desc">Replace local data with demo data</div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={onReset}>Reset</button>
        </div>
      </section>
    </div>
  );
}
