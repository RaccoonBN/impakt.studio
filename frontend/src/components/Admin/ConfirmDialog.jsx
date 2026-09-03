import React, {
  useEffect,
  useState,
} from 'react';

import {
  AlertTriangle,
  Trash2,
} from 'lucide-react';

import AdminModal from './AdminModal';

import './ConfirmDialog.css';

const ConfirmDialog = ({
  open,
  title = 'Xác nhận thao tác',
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  requireReason = false,
  reasonLabel = 'Lý do',
  loading = false,
  onCancel,
  onConfirm,
}) => {
  const [
    reason,
    setReason,
  ] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const disabled =
    loading ||
    (
      requireReason &&
      !reason.trim()
    );

  return (
    <AdminModal
      eyebrow="Confirm"
      title={title}
      onClose={onCancel}
    >
      <div className="ia-confirm-content">
        <span>
          <AlertTriangle size={22} />
        </span>

        <p>{message}</p>
      </div>

      {requireReason && (
        <label className="ia-confirm-reason">
          <span>{reasonLabel}</span>

          <textarea
            value={reason}
            placeholder="Nhập lý do để tiếp tục…"
            onChange={(event) =>
              setReason(
                event.target.value,
              )
            }
          />
        </label>
      )}

      <footer className="ia-modal-footer">
        <button
          type="button"
          className="ia-secondary-button"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </button>

        <button
          type="button"
          className="ia-confirm-button"
          onClick={() =>
            onConfirm({
              reason:
                reason.trim(),
            })
          }
          disabled={disabled}
        >
          <Trash2 size={16} />
          {loading
            ? 'Đang xử lý…'
            : confirmLabel}
        </button>
      </footer>
    </AdminModal>
  );
};

export default ConfirmDialog;
