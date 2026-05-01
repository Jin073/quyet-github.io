import { Moon, Sun } from 'lucide-react';
import { ACCENTS } from '../../lib/constants.js';
import { AccountControl } from '../../features/settings/AccountControl.jsx';

export function Sidebar({ nav, view, open, settings, googleUser, onNavigate, onSettings, onGoogleOAuth, onGoogleLogout }) {
  let lastGroup = '';

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-logo">F</div>
        <div>
          <div className="brand-name">Finova</div>
          <div className="brand-sub">Personal Finance</div>
        </div>
      </div>
      <div className="sidebar-account">
        <AccountControl googleUser={googleUser} onGoogleOAuth={onGoogleOAuth} onGoogleLogout={onGoogleLogout} />
      </div>

      <nav className="nav">
        {nav.map((item) => {
          const showGroup = item.group !== lastGroup;
          lastGroup = item.group;
          const Icon = item.icon;
          return (
            <div key={item.key}>
              {showGroup && <div className="nav-group">{item.group}</div>}
              <button
                className={`nav-item ${view === item.key ? 'active' : ''}`}
                onClick={() => onNavigate(item.key)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="theme-pills">
          {ACCENTS.map((accent) => (
            <button
              key={accent}
              className={`theme-pill ${settings.accent === accent ? 'active' : ''}`}
              data-color={accent}
              title={accent}
              onClick={() => onSettings({ accent })}
            />
          ))}
        </div>
        <button
          className="icon-btn"
          title="Toggle dark mode"
          onClick={() => onSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
        >
          {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </aside>
  );
}
