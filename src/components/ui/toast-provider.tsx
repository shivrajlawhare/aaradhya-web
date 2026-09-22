import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Alert, Portal, Stack } from '@mui/material';
import { errorAlertStyles, successAlertStyles, toastStackStyles } from './toast-provider.styles';

type ToastSeverity = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  severity: ToastSeverity;
}

interface ToastContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Long enough to read a short sentence, short enough not to pile up if
// several mutations resolve in quick succession.
const AUTO_DISMISS_MS = 4000;

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
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, severity: ToastSeverity) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, severity }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
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
              sx={toast.severity === 'success' ? successAlertStyles : errorAlertStyles}
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
