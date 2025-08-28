import React from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';

/**
 * PUBLIC_INTERFACE
 * AuthForm
 * A shared authentication form wrapper providing consistent layout, spacing, accessibility,
 * and responsive design for Login and Signup forms, styled to match the app's modern,
 * minimal light theme and brand colors.
 *
 * Props:
 * - title: string - The form title (e.g., "Sign in", "Create account")
 * - subtitle?: string - Optional subtitle text
 * - onSubmit: (e: FormEvent) => void - Submit handler for the internal <form>
 * - children: React.ReactNode - Input/content placed inside the form
 * - actions?: React.ReactNode - Area for action buttons (primary CTA and optional OAuth)
 * - footer?: React.ReactNode - Footer line (e.g., links to Signup/Login)
 */
export default function AuthForm({
  title,
  subtitle,
  onSubmit,
  children,
  actions,
  footer,
}) {
  // Page container with subtle split hero feel on wide screens
  const container = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    alignItems: 'center',
    justifyItems: 'center',
    minHeight: '100vh',
    padding: 'var(--space-6) var(--space-4)',
    width: '100%',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
    background:
      'radial-gradient(1200px 400px at 100% -20%, rgba(25,118,210,0.06), transparent 60%), ' +
      'radial-gradient(800px 320px at -10% 110%, rgba(255,152,0,0.06), transparent 60%)',
  };

  // Decorative accent bar at top for brand presence
  const accentBar = {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: 4,
    borderRadius: 999,
    background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
    opacity: 0.9,
  };

  const card = {
    background: 'var(--surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: 'var(--space-6)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: 520,
    boxSizing: 'border-box',
    overflow: 'hidden',
    position: 'relative',
  };

  // subtle accent ring shadow
  const cardAccent = {
    content: '""',
    position: 'absolute',
    inset: -2,
    borderRadius: 24,
    padding: 2,
    background: 'linear-gradient(135deg, rgba(25,118,210,0.25), rgba(255,152,0,0.25))',
    WebkitMask:
      'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    pointerEvents: 'none',
  };

  const header = {
    marginBottom: 'var(--space-5)',
    textAlign: 'center',
  };

  const badge = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(25,118,210,0.08)',
    color: 'var(--color-secondary)',
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid var(--border-color)',
  };

  const titleStyle = {
    margin: '10px 0 0',
    fontSize: 28,
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
  };

  const subtitleStyle = {
    margin: 'var(--space-2) auto 0',
    color: 'var(--text-secondary)',
    fontSize: 14,
    maxWidth: 420,
  };

  // Group inputs with a subtle background to improve scannability
  const formGroup = {
    display: 'grid',
    gap: 'var(--space-3)',
    padding: 'var(--space-4)',
    borderRadius: 14,
    background: 'linear-gradient(180deg, #fff, #fff)',
    border: '1px solid var(--border-color)',
  };

  const formGrid = {
    display: 'grid',
    gap: 'var(--space-4)',
    width: '100%',
    boxSizing: 'border-box',
  };

  const actionsStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    marginTop: 'var(--space-2)',
    width: '100%',
  };

  const divider = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    color: 'var(--muted)',
    fontSize: 12,
    alignSelf: 'stretch',
    maxWidth: '100%',
    boxSizing: 'border-box',
  };

  const dividerLine = {
    flex: 1,
    height: 1,
    background:
      'linear-gradient(90deg, transparent, var(--border-color), transparent)',
  };

  const footerStyle = {
    textAlign: 'center',
    marginTop: 'var(--space-4)',
    fontSize: 14,
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <section aria-labelledby="auth-form-title" style={container}>
      <div style={accentBar} aria-hidden="true" />
      <div style={card}>
        <div style={cardAccent} aria-hidden="true" />
        <header style={header}>
          <span style={badge} aria-hidden="true">
            Meeting Manager
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: 'var(--color-accent)',
                boxShadow: '0 0 0 3px rgba(255,152,0,0.15)',
              }}
            />
          </span>
          <h1 id="auth-form-title" style={titleStyle}>{title}</h1>
          {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
        </header>

        <form onSubmit={onSubmit} noValidate style={formGrid}>
          <div style={formGroup}>{children}</div>

          {actions ? (
            <div style={actionsStyle}>
              {actions}

              <div role="separator" aria-hidden="true" style={divider}>
                <span style={dividerLine} />
                or
                <span style={dividerLine} />
              </div>
            </div>
          ) : null}
        </form>

        {footer ? <div style={footerStyle}>{footer}</div> : null}
      </div>
    </section>
  );
}

AuthForm.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
  footer: PropTypes.node,
};
