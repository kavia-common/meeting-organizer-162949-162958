import React, { useCallback, useImperativeHandle, useRef, useState, forwardRef, useEffect } from 'react';

/**
 * PUBLIC_INTERFACE
 * ToastContainer - lightweight notification system.
 *
 * Usage:
 *  const toastRef = useRef();
 *  <ToastContainer ref={toastRef} />
 *  toastRef.current?.show({ title: 'Saved', description: 'Your meeting was saved.' , type: 'success' });
 *
 * API:
 *  ref.current.show({ id?, title, description?, type?: 'info'|'success'|'warning'|'error', duration?: ms })
 *  ref.current.dismiss(id)
 */
const ToastContainer = forwardRef(function ToastContainer(_, ref) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const show = useCallback(({ id, title, description, type = 'info', duration = 3500 }) => {
    const nextId = id ?? `t_${Date.now()}_${idRef.current++}`;
    const toast = { id: nextId, title, description, type, duration };
    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== nextId));
      }, duration);
    }
    return nextId;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useImperativeHandle(ref, () => ({ show, dismiss }), [show, dismiss]);

  // Positioning and styles
  const container = {
    position: 'fixed',
    top: 16,
    right: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 1100,
  };

  const base = {
    minWidth: 260,
    maxWidth: 360,
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    display: 'grid',
    gridTemplateColumns: '24px 1fr auto',
    gap: 8,
    alignItems: 'start',
  };

  const typeBadge = (type) => {
    const colors = {
      info: { bg: 'var(--bg-secondary)', fg: 'var(--link-color)' },
      success: { bg: '#ecfdf5', fg: '#059669' },
      warning: { bg: '#fffbeb', fg: '#d97706' },
      error: { bg: '#fef2f2', fg: '#dc2626' },
    };
    const c = colors[type] ?? colors.info;
    return {
      width: 24,
      height: 24,
      borderRadius: 999,
      background: c.bg,
      color: c.fg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      fontWeight: 800,
    };
  };

  const icon = (type) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '!';
      case 'error':
        return '⚠';
      default:
        return 'i';
    }
  };

  useEffect(() => {
    // Ensure container is accessible to screen readers
    // eslint-disable-next-line no-undef
    return () => {};
  }, []);

  return (
    <div style={container} aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div key={t.id} style={base} role="status">
          <div style={typeBadge(t.type)} aria-hidden="true">
            {icon(t.type)}
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{t.title}</div>
            {t.description && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.description}</div>
            )}
          </div>
          <button
            aria-label="Dismiss notification"
            onClick={() => dismiss(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 'var(--radius-sm)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
});

export default ToastContainer;
