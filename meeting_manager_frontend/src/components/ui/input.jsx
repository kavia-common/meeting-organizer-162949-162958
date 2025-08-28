import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Input component aligned with theme variables.
 */
export const Input = React.forwardRef(({ className = '', ...props }, ref) => {
  return <input ref={ref} className={['mm-input', className].join(' ')} {...props} />;
});
Input.displayName = 'Input';
