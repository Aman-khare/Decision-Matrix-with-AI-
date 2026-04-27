// ──────────────────────────────────────────
// Toast notification system
// ──────────────────────────────────────────
// Uses a module-level setter reference initialised via initToast()
// called once inside a useEffect in App.jsx (not during render).

let _toastId = 0;
let _setToasts = null;

/** Called once from App's useEffect to wire up the state setter. */
export function initToast(setter) {
  _setToasts = setter;
}

/**
 * Show a toast. Safe to call before initToast — queued toasts are dropped
 * rather than throwing.
 *
 * @param {string} message
 * @param {'info'|'success'|'error'|'warning'} type
 * @param {number} duration  ms before auto-dismiss
 */
export function toast(message, type = 'info', duration = 3500) {
  if (!_setToasts) {
    // initToast not yet called — silently no-op
    return;
  }
  const id = ++_toastId;
  _setToasts((prev) => [...prev, { id, message, type }]);
  setTimeout(() => {
    _setToasts((prev) => prev.filter((t) => t.id !== id));
  }, duration);
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        pointerEvents: 'none',
        maxWidth: 360,
        width: 'calc(100vw - 3rem)',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          style={{ pointerEvents: 'auto' }}
          role="alert"
          onClick={() => onDismiss(t.id)}
          title="Click to dismiss"
        >
          <span className="toast-icon" aria-hidden="true">
            {t.type === 'success' ? '✓'
              : t.type === 'error' ? '✕'
              : t.type === 'warning' ? '⚠'
              : 'ℹ'}
          </span>
          <span className="toast-message">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
