import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './app';
import { handleAuthError } from './api/handle-auth-error';
import { AuthProvider } from './stores/auth-context';
import { theme } from './theme/theme';
import { tsr } from './api/client';

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleAuthError }),
  mutationCache: new MutationCache({ onError: handleAuthError }),
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {/* Every DatePicker/StaticTimePicker in the app (STORY-057) reads
              from this one adapter — dayjs, the lightest of the date libs
              @mui/x-date-pickers supports. DD/MM/YYYY comes from theme.ts's
              own MuiDatePicker defaultProps, not a locale swap here — a
              locale also changes week-start/month names as a side effect,
              which this fix isn't about. */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <AuthProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </AuthProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>
  </StrictMode>,
);
