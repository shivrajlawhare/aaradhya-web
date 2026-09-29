import type { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material';
import { theme, THEME_MODE_STORAGE_KEY } from './theme';

interface AppThemeProviderProps {
  children: ReactNode;
}

// The app's theme with light/dark mode: light by default, and the chosen mode
// (useColorScheme().setMode) persisted in localStorage.
const AppThemeProvider = ({ children }: AppThemeProviderProps) => (
  <ThemeProvider theme={theme} defaultMode="light" modeStorageKey={THEME_MODE_STORAGE_KEY}>
    {children}
  </ThemeProvider>
);

export default AppThemeProvider;
