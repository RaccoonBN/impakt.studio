import React from 'react';

import {
  LogOut,
  Menu,
} from 'lucide-react';

import './AdminTopbar.css';

const AdminTopbar = ({
  title,
  subtitle = 'IMPAKT Studio',
  onMenu,
  onLogout,
}) => (
  <header className="ia-topbar">
    <div className="ia-topbar-left">
      <button
        type="button"
        className="ia-menu-button"
        onClick={onMenu}
        aria-label="Mở menu"
      >
        <Menu size={20} />
      </button>

      <div>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
    </div>

    <button
      type="button"
      className="ia-logout-button"
      onClick={onLogout}
    >
      <LogOut size={17} />
      Đăng xuất
    </button>
  </header>
);

export default AdminTopbar;
