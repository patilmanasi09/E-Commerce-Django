import Modal from './Modal'

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, busy }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="confirm-message">{message}</p>
      <div className="form-actions">
        <button className="btn btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="btn btn--danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
