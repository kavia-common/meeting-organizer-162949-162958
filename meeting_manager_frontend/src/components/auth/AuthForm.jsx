import React from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';

/**
 * PUBLIC_INTERFACE
 * AuthForm
 * A shared authentication form wrapper providing consistent layout, spacing, accessibility,
 * and responsive design for Login and Signup forms.
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
  const container = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    alignItems: 'center',
    justifyItems: 'center',
    minHeight: 'calc(100vh - 80px)',
    padding: 'var(--space-6) var(--space-4)',
    width: '100%',
    boxSizing: 'border-box',
  };

  const card = {
    background: 'var(--surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: 460,
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  const header = {
    marginBottom: 'var(--space-5)',
    textAlign: 'center',
  };

  const titleStyle = {
    margin: 0,
    fontSize: 26,
    lineHeight: 1.3,
  };

  const subtitleStyle = {
    margin: 'var(--space-2) 0 0',
    color: 'var(--text-secondary)',
    fontSize: 14,
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
    background: 'var(--border-color)',
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
      <div style={card}>
        <header style={header}>
          <h1 id="auth-form-title" style={titleStyle}>{title}</h1>
          {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
        </header>

        <form onSubmit={onSubmit} noValidate style={formGrid}>
          {children}

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
