import { Chrome, LogOut } from 'lucide-react';

export function AccountControl({ googleUser, onGoogleOAuth, onGoogleLogout }) {
  if (googleUser) {
    return (
      <div className="account-chip">
        {googleUser.picture && <img src={googleUser.picture} alt="" className="account-avatar" referrerPolicy="no-referrer" />}
        <div className="account-copy">
          <strong>{googleUser.name || googleUser.email}</strong>
          {googleUser.email && <span>{googleUser.email}</span>}
        </div>
        <button className="icon-btn" title="Logout" onClick={onGoogleLogout}>
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <button className="btn btn-ghost btn-sm account-login" onClick={onGoogleOAuth}>
      <Chrome size={14} />
      Continue with Google
    </button>
  );
}
