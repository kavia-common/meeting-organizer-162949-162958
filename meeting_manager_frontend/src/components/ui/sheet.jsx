import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

/**
 * PUBLIC_INTERFACE
 * A simple Sheet component built on top of Radix Dialog.
 */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({ side = 'left', className = '', children, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="mm-sheet__overlay" />
      <DialogPrimitive.Content
        {...props}
        className={['mm-sheet__content', `mm-sheet__content--${side}`, className].join(' ')}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const SheetHeader = ({ className = '', ...props }) => (
  <div className={['mm-sheet__header', className].join(' ')} {...props} />
);
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;
