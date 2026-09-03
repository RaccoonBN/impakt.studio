import React from 'react';

import './AdminSidebar.css';

const AdminSidebar = ({
  items,
  activeKey,
  username,
  open,
  onNavigate,
  onClose,
}) => (
  <>
    <aside
      className={`ia-sidebar ${
        open
          ? 'is-open'
          : ''
      }`}
    >
      <div className="ia-sidebar-brand">
        <span className="ia-brand-mark">
          I
        </span>

        <div>
          <strong>
            IMPAKT Admin
          </strong>
          <small>
            Internal workspace
          </small>
        </div>
      </div>

      <nav className="ia-nav">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              type="button"
              key={item.key}
              className={
                activeKey === item.key
                  ? 'is-active'
                  : ''
              }
              onClick={() =>
                onNavigate(item.key)
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="ia-sidebar-user">
        <small>Đã đăng nhập</small>
        <strong>{username}</strong>
      </div>
    </aside>

    {open && (
      <button
        type="button"
        className="ia-sidebar-overlay"
        onClick={onClose}
        aria-label="Đóng menu"
      />
    )}
  </>
);

export default AdminSidebar;
