import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Button - a reusable button component with minimal modern styles.
 * - Supports variants: 'primary' | 'secondary' | 'ghost'
 * - Supports sizes: 'sm' | 'md' | 'lg'
 * - Forwards other button props (onClick, type, disabled, aria-*, etc.)
 *
 * Example:
 *  <Button onClick={...}>Save</Button>
 *  <Button variant="secondary" size="sm">Cancel</Button>
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...rest
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: 600,
    textDecoration: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  const sizeStyles = {
    sm: { padding: '6px 10px', fontSize: 12 },
    md: { padding: '10px 14px', fontSize: 14 },
    lg: { padding: '12px 18px', fontSize: 16 },
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--button-bg)',
      color: 'var(--button-text)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
    secondary: {
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--link-color)',
      border: '1px solid transparent',
    },
  };

  const hoverStyles = !disabled
    ? {
        transform: 'translateY(-1px)',
        filter: 'brightness(0.98)',
      }
    : {};

  const style = {
    ...base,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      style={style}
      onMouseEnter={(e) => {
        if (disabled) return;
        Object.assign(e.currentTarget.style, hoverStyles);
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.filter = 'none';
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
