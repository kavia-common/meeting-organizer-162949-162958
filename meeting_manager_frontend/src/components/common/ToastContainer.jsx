import React, { useEffect } from 'react';

/**
 * Deprecated component - retained for backward compatibility only.
 * Renders nothing. Use useToast() from components/ui/toast to trigger toasts.
 */
export default function ToastContainer() {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.warn('[Deprecated] <ToastContainer /> is deprecated. Use useToast() and <Toaster /> instead.');
  }, []);
  return null;
}
