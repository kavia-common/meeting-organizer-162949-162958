import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

/**
 * PUBLIC_INTERFACE
 * Dialog primitives built on top of Radix Dialog.
 *
 * Usage:
 *  <Dialog open={open} onOpenChange={setOpen}>
 *    <DialogContent>
 *      <DialogHeader>
 *        <DialogTitle>Title</DialogTitle>
 *        <DialogDescription>Optional description</DialogDescription>
 *      </DialogHeader>
 *      ...content...
 *      <DialogFooter>
 *        <Button>Action</Button>
 *      </DialogFooter>
 *    </DialogContent>
 *  </Dialog>
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

/**
 * PUBLIC_INTERFACE
 * DialogHeader - simple header container for spacing and layout.
 */
export function DialogHeader({ className = '', ...props }) {
  return <div className={['mm-dialog__header', className].join(' ')} {...props} />;
}

/**
 * PUBLIC_INTERFACE
 * DialogFooter - simple footer container to layout action buttons.
 */
export function DialogFooter({ className = '', ...props }) {
  return <div className={['mm-dialog__footer', className].join(' ')} {...props} />;
}

/**
 * PUBLIC_INTERFACE
 * DialogContent - portal + overlay + content wrapper.
 */
export const DialogContent = React.forwardRef(function DialogContent(
  { className = '', children, ...props },
  ref
) {
  return (
    <DialogPortal>
      <DialogPrimitive.Overlay className="mm-dialog__overlay" />
      <DialogPrimitive.Content ref={ref} className={['mm-dialog__content', className].join(' ')} {...props}>
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
