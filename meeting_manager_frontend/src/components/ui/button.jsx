import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Button component aligned with theme variables.
 */
export const Button = React.forwardRef(
  (
    {
      asChild = false,
      variant = 'default',
      size = 'md',
      className = '',
      disabled = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? 'span' : 'button';

    const base =
      'mm-btn';
    const classes = [
      base,
      `mm-btn--${variant}`,
      `mm-btn--${size}`,
      disabled ? 'is-disabled' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <Comp ref={ref} className={classes} disabled={disabled} {...props} />;
  }
);

Button.displayName = 'Button';
