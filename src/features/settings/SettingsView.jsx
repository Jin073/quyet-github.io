import { ACCENTS } from '../../lib/constants.js';

export function SettingsView({ data, onSettings }) {
  return (
    <div className="settings-grid">
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
    </div>
  );
}
