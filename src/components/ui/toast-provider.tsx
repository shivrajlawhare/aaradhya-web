import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Alert, Portal, Stack } from '@mui/material';
import { EXIT_DURATION_MS, type ToastSeverity, toastStackStyles, toastStyles } from './toast-provider.styles';

interface Toast {
  id: number;
  message: string;
  severity: ToastSeverity;
  // Set when the toast starts its exit animation; it is removed from state
  // once that animation has had time to finish.
  isLeaving: boolean;
}

interface ToastContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// The redesign's toast timing (Motion spec: visible for 2500 ms, then exit).
export const AUTO_DISMISS_MS = 2500;

interface ToastProviderProps {
  children: ReactNode;
}

// Mounted once near the app root (main.tsx), above <BrowserRouter> — every
// toast lives in this component's own state, not the caller's, so a toast
// fired right before its caller unmounts (e.g. navigating away immediately
// after a successful save) has nothing of its own to lose: the timer that
// later dismisses it keeps running against this provider's state
// regardless of what happened to whatever called showSuccess/showError.
export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, isLeaving: true } : toast)));
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, EXIT_DURATION_MS);
  }, []);

  const show = useCallback(
    (message: string, severity: ToastSeverity) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, severity, isLeaving: false }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  const showSuccess = useCallback((message: string) => show(message, 'success'), [show]);
  const showError = useCallback((message: string) => show(message, 'error'), [show]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
      <Portal>
        {/* A Stack of independently-dismissing Alerts, not MUI's own
            Snackbar — Snackbar only ever shows one at a time (a second
            queues behind the first), but two mutations resolving in quick
            succession must stack instead of one replacing/hiding the other
            (this story's own edge case). */}
        <Stack sx={toastStackStyles} role="status" aria-live="polite">
          {toasts.map((toast) => (
            <Alert
              key={toast.id}
              severity={toast.severity}
              onClose={() => dismiss(toast.id)}
              sx={toastStyles(toast.severity, toast.isLeaving)}
            >
              {toast.message}
            </Alert>
          ))}
        </Stack>
      </Portal>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
