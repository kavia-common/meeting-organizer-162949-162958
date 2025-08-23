import React, { useEffect } from 'react';

/**
 * PUBLIC_INTERFACE
 * Modal - accessible modal dialog with backdrop, close controls and callbacks.
 *
 * Props:
 * - open: boolean - controls visibility
 * - onClose: () => void - called when modal requests to close (backdrop/Escape/close button)
 * - title?: string - optional header title
 * - children: React.ReactNode - modal content
 * - footer?: React.ReactNode - optional footer area (e.g., actions)
 *
 * Example:
 *  <Modal open={isOpen} onClose={() => setOpen(false)} title="Add Meeting">
 *    <YourForm />
 *  </Modal>
 */
export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape' && open) {
        onClose?.();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const backdrop = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 1000,
  };

  const panel = {
    width: '100%',
    maxWidth: 560,
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  };

  const header = {
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontWeight: 700,
  };

  const body = {
    padding: 16,
  };

  const footerStyle = {
    padding: 12,
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  };

  const closeBtn = {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 6,
    borderRadius: 'var(--radius-sm)',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      style={backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div style={panel}>
        {(title || onClose) && (
          <div style={header}>
            <div id="modal-title">{title}</div>
            {onClose && (
              <button
                aria-label="Close"
                onClick={onClose}
                style={closeBtn}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div style={body}>{children}</div>
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  );
}
