import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

/**
 * PUBLIC_INTERFACE
 * Tooltip primitives
 */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef(({ className = '', sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={['mm-tooltip', className].join(' ')}
    {...props}
  />
));
TooltipContent.displayName = 'TooltipContent';
