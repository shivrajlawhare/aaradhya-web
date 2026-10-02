import type { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material';
import { useReducedMotion } from './motion';
import { reducedMotionTheme, theme, THEME_MODE_STORAGE_KEY } from './theme';

interface AppThemeProviderProps {
  children: ReactNode;
}

// The app's theme with light/dark mode: light by default, and the chosen mode
// (useColorScheme().setMode) persisted in localStorage. Under
// prefers-reduced-motion the zero-duration theme is used instead (DEV-15).
const AppThemeProvider = ({ children }: AppThemeProviderProps) => {
  const isReducedMotion = useReducedMotion();
  let activeTheme = theme;
  if (isReducedMotion) {
    activeTheme = reducedMotionTheme;
  }

  return (
    <ThemeProvider theme={activeTheme} defaultMode="light" modeStorageKey={THEME_MODE_STORAGE_KEY}>
      {children}
    </ThemeProvider>
  );
};

export default AppThemeProvider;
