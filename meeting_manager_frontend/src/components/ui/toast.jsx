import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import "./ui.css";

/**
 * Shadcn-inspired Toast system implemented without external deps.
 * Provides:
 * - ToastProvider: context for toasts
 * - useToast: hook to trigger toasts
 * - Toaster: UI container to render toasts
 *
 * Types:
 * Toast = {
 *   id: string,
 *   title?: string,
 *   description?: string,
 *   variant?: "default" | "destructive" | "success" | "warning",
 *   action?: { label: string, onClick: () => void },
 *   duration?: number, // ms
 * }
 */

// PUBLIC_INTERFACE
export function cn(...classes) {
  /** Utility to concatenate conditional class names. */
  return classes.filter(Boolean).join(" ");
}

const ToastContext = createContext(null);

// PUBLIC_INTERFACE
export function ToastProvider({ children, duration = 3500 }) {
  /**
   * Provides toast queue and helpers.
   * duration: default toast auto-close time in ms.
   */
  const [toasts, setToasts] = useState([]);

  // Add a toast and return its id
  const toast = (input) => {
    const id = input?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next = {
      id,
      title: input?.title,
      description: input?.description,
      variant: input?.variant || "default",
      action: input?.action,
      duration: input?.duration ?? duration,
    };
    setToasts((prev) => [...prev, next]);
    return { id, dismiss: () => dismiss(id), update: (patch) => update(id, patch) };
  };

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const update = (id, patch) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const value = useMemo(() => ({ toasts, toast, dismiss, update }), [toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useToast() {
  /**
   * Hook to trigger toasts.
   * Usage: const { toast, dismiss } = useToast();
   *        toast({ title: "Saved", description: "Your changes are saved.", variant: "success" })
   */
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

// PUBLIC_INTERFACE
export function Toaster({ position = "top-right" }) {
  /**
   * Renders the active toasts to the screen.
   * position: "top-right" | "top-left" | "bottom-right" | "bottom-left"
   */
  const { toasts, dismiss } = useToast();

  return (
    <ToastViewport position={position}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </ToastViewport>
  );
}

function ToastViewport({ children, position = "top-right" }) {
  const positionClass = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  }[position] || "top-4 right-4";

  // The project uses a simple CSS baseline; using classes defined in ui.css plus inline-tailwind-like styles
  return (
    <div
      className={cn(
        "ui-toast-viewport",
        "fixed z-50 flex w-full max-w-sm flex-col gap-2",
        positionClass
      )}
      role="region"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {children}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { id, title, description, variant, action, duration } = toast;
  const timerRef = useRef(null);

  useEffect(() => {
    if (duration === Infinity) return;
    timerRef.current = setTimeout(() => onDismiss(), Math.max(800, duration || 3500));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration, onDismiss]);

  const variantClass =
    variant === "destructive"
      ? "ui-toast--destructive"
      : variant === "success"
      ? "ui-toast--success"
      : variant === "warning"
      ? "ui-toast--warning"
      : "ui-toast--default";

  return (
    <div className={cn("ui-toast", variantClass)} role="status" aria-atomic="true" data-id={id}>
      <div className="ui-toast__content">
        {title && <div className="ui-toast__title">{title}</div>}
        {description && <div className="ui-toast__description">{description}</div>}
      </div>
      <div className="ui-toast__actions">
        {action?.label ? (
          <button
            className={cn("ui-btn ui-btn--ghost ui-toast__action-btn")}
            onClick={() => {
              try {
                action?.onClick?.();
              } finally {
                onDismiss();
              }
            }}
          >
            {action.label}
          </button>
        ) : null}
        <button
          aria-label="Close"
          className={cn("ui-btn ui-btn--ghost ui-toast__close-btn")}
          onClick={onDismiss}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function withToastProvider(AppRoot, options = {}) {
  /**
   * Convenience HOC to wrap the app with ToastProvider and drop a Toaster at the top-level.
   * Example:
   *   export default withToastProvider(App);
   */
  const { duration, position } = options;
  return function WithToastProvider(props) {
    return (
      <ToastProvider duration={duration}>
        <AppRoot {...props} />
        <Toaster position={position} />
      </ToastProvider>
    );
  };
}
