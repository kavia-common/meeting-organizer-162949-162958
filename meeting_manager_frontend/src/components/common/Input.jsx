import React, { forwardRef, useId } from 'react';

/**
 * PUBLIC_INTERFACE
 * Input - a reusable text input component with label, helper text and error state.
 *
 * Props:
 * - label?: string
 * - helperText?: string
 * - error?: string | boolean
 * - id?: string
 * - type?: string (default 'text')
 * - ...rest standard input props
 *
 * Example:
 *  <Input label="Email" type="email" placeholder="you@example.com" />
 *  <Input label="Title" error="Title is required" />
 */
const Input = forwardRef(function Input(
  { label, helperText, error, className = '', style = {}, id: idProp, ...rest },
  ref
) {
  const generatedId = useId();
  const inputId = idProp || generatedId;
  const helperId = error ? `${inputId}-helper` : undefined;

  const wrapper = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-secondary)',
    letterSpacing: 0.2,
  };

  const inputStyle = {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    padding: '12px 14px',
    borderRadius: 12,
    border: `1px solid ${error ? '#ef4444' : 'var(--border-color)'}`,
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: 15,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    boxSizing: 'border-box',
  };

  const helper = {
    fontSize: 12,
    color: error ? '#ef4444' : 'var(--muted)',
    minHeight: 18,
  };

  return (
    <div className={className} style={{ ...wrapper, ...style }}>
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        style={inputStyle}
        aria-invalid={Boolean(error)}
        aria-describedby={helperId}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--link-color)';
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--focus-ring)';
          e.currentTarget.style.background = '#fff';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#ef4444' : 'var(--border-color)';
          e.currentTarget.style.boxShadow = '0 0 0 0 transparent';
          e.currentTarget.style.background = 'var(--surface)';
        }}
        {...rest}
      />
      <div id={helperId} style={helper} aria-live="polite">
        {typeof error === 'string' ? error : helperText}
      </div>
    </div>
  );
});

export default Input;
