import React from 'react';

import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  Save,
} from 'lucide-react';

export const Field = ({
  label,
  required = false,
  full = false,
  children,
}) => (
  <label
    className={`ia-field ${
      full
        ? 'is-full'
        : ''
    }`}
  >
    <span>
      {label}
      {required && <b>*</b>}
    </span>
    {children}
  </label>
);

export const Alert = ({
  message,
  success = false,
}) =>
  message ? (
    <div
      className={
        success
          ? 'ia-success-alert'
          : 'ia-alert'
      }
    >
      {success ? (
        <CheckCircle2
          size={18}
        />
      ) : (
        <AlertCircle
          size={18}
        />
      )}
      <span>{message}</span>
    </div>
  ) : null;

export const FormFooter = ({
  saving,
  onCancel,
  onSave,
}) => (
  <footer className="ia-modal-footer">
    <button
      type="button"
      className="ia-secondary-button"
      onClick={onCancel}
      disabled={saving}
    >
      Hủy
    </button>

    <button
      type="button"
      className="ia-primary-button"
      onClick={onSave}
      disabled={saving}
    >
      <Save size={17} />
      {saving
        ? 'Đang lưu…'
        : 'Lưu dữ liệu'}
    </button>
  </footer>
);

export const SummaryCard = ({
  icon: Icon,
  label,
  value,
  note,
  onClick,
}) => (
  <button
    type="button"
    className="ia-summary-card"
    onClick={onClick}
  >
    <span>
      <Icon size={20} />
    </span>

    <div>
      <small>{label}</small>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  </button>
);

export const ProgressBar = ({
  value,
}) => {
  const percent =
    Math.min(
      Math.max(
        Number(value) || 0,
        0,
      ),
      100,
    );

  return (
    <div className="ia-progress">
      <span>
        <i
          style={{
            width: `${percent}%`,
          }}
        />
      </span>
      <b>{percent}%</b>
    </div>
  );
};

export const EmptyState = ({
  title,
  description,
  action,
}) => (
  <div className="ia-empty-state">
    <CircleDollarSign
      size={26}
    />
    <strong>{title}</strong>
    <p>{description}</p>
    {action}
  </div>
);

export default {
  Field,
  Alert,
  FormFooter,
  SummaryCard,
  ProgressBar,
  EmptyState,
};
