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
    borderRadius: '12px',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease',
    fontWeight: 700,
    letterSpacing: 0.1,
    textDecoration: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  };

  const sizeStyles = {
    sm: { padding: '10px 14px', fontSize: 13 },
    md: { padding: '12px 16px', fontSize: 15 },
    lg: { padding: '14px 18px', fontSize: 16 },
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--button-bg)',
      color: 'var(--button-text)',
      boxShadow: '0 6px 14px rgba(25,118,210,0.25), 0 2px 6px rgba(0,0,0,0.06)',
    },
    secondary: {
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
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

  const focusVisible = (el) => {
    el.style.boxShadow = '0 0 0 3px var(--focus-ring)';
  };

  const resetHover = (el) => {
    el.style.transform = 'translateY(0)';
    el.style.filter = 'none';
    el.style.boxShadow = 'none';
  };

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
        resetHover(e.currentTarget);
      }}
      onFocus={(e) => focusVisible(e.currentTarget)}
      onBlur={(e) => resetHover(e.currentTarget)}
      {...rest}
    >
      {children}
    </button>
  );
}
