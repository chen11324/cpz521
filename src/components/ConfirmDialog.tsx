import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = '??', cancelLabel = '??', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon"><AlertTriangle size={28} /></div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel}>{cancelLabel}</button>
          <button className="confirm-ok" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
