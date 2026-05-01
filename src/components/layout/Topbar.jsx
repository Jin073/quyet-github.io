import { Menu, Plus, Search } from 'lucide-react';

export function Topbar({ title, subtitle, search, onSearch, onMenu, onAdd }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn menu-toggle" onClick={onMenu} aria-label="Open navigation">
          <Menu size={20} />
        </button>
        <div>
          <div className="page-title">{title}</div>
          <div className="page-sub">{subtitle}</div>
        </div>
      </div>
      <div className="topbar-right">
        <label className="search-box">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search transactions..."
          />
        </label>
        <button className="btn btn-primary" onClick={onAdd}>
          <Plus size={16} />
          <span>New Transaction</span>
        </button>
      </div>
    </header>
  );
}
