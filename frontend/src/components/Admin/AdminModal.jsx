import React from 'react';

import {
  X,
} from 'lucide-react';

import './AdminModal.css';

const AdminModal = ({
  eyebrow,
  title,
  onClose,
  children,
  wide = false,
}) => (
  <div
    className="ia-modal-backdrop"
    role="presentation"
    onMouseDown={(event) => {
      if (
        event.target ===
        event.currentTarget
      ) {
        onClose();
      }
    }}
  >
    <section
      className={`ia-modal ${
        wide
          ? 'is-wide'
          : ''
      }`}
      role="dialog"
      aria-modal="true"
    >
      <header className="ia-modal-header">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>

        <button
          type="button"
          className="ia-icon-button"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </header>

      {children}
    </section>
  </div>
);

export default AdminModal;
