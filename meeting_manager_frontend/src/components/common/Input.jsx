import React, { forwardRef } from 'react';

/**
 * PUBLIC_INTERFACE
 * Input - a reusable text input component with label, helper text and error state.
 *
 * Props:
 * - label?: string
 * - helperText?: string
 * - error?: string | boolean
 * - type?: string (default 'text')
 * - ...rest standard input props
 *
 * Example:
 *  <Input label="Email" type="email" placeholder="you@example.com" />
 *  <Input label="Title" error="Title is required" />
 */
const Input = forwardRef(function Input(
  { label, helperText, error, className = '', style = {}, ...rest },
  ref
) {
  const wrapper = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${error ? '#ef4444' : 'var(--border-color)'}`,
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: 14,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  };

  const helper = {
    fontSize: 12,
    color: error ? '#ef4444' : 'var(--muted)',
    minHeight: 18,
  };

  return (
    <div className={className} style={{ ...wrapper, ...style }}>
      {label && (
        <label style={labelStyle}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        style={inputStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--link-color)';
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--focus-ring)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#ef4444' : 'var(--border-color)';
          e.currentTarget.style.boxShadow = '0 0 0 0 transparent';
        }}
        {...rest}
      />
      <div style={helper}>
        {typeof error === 'string' ? error : helperText}
      </div>
    </div>
  );
});

export default Input;
