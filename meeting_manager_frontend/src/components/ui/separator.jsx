import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';

/**
 * PUBLIC_INTERFACE
 * Horizontal or Vertical separator line.
 */
export function Separator({ orientation = 'horizontal', decorative = true, className = '', ...props }) {
  return (
    <SeparatorPrimitive.Root
      decorative={decorative}
      orientation={orientation}
      className={[
        'mm-separator',
        orientation === 'vertical' ? 'mm-separator--vertical' : 'mm-separator--horizontal',
        className,
      ].join(' ')}
      {...props}
    />
  );
}
