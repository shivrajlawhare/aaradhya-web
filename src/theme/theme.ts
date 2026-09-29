import { createTheme, type Theme } from '@mui/material/styles';
// Types theme.vars (the palette CSS variables) as always present, since the
// theme is built with cssVariables.
import type {} from '@mui/material/themeCssVarsAugmentation';
// Registers MuiDatePicker / MuiClock / MuiPickers* (and friends) as valid
// `components` keys for the overrides in components.ts.
import '@mui/x-date-pickers/themeAugmentation';
// Side-effecting only — registers MuiEventCalendar (StandaloneMonthView's own
// component family) as a valid `components` key/class-key set.
import '@mui/x-scheduler/theme-augmentation';
import { components } from './components';
import { darkPalette, lightPalette, motionTokens, scaleTokens } from './tokens';
import { typography } from './typography';

type BrandPalette = typeof lightPalette.brand;
type StatusPalette = typeof lightPalette.status;
type NavPalette = typeof lightPalette.nav;
type TabPalette = typeof lightPalette.tab;
type FeedbackPalette = typeof lightPalette.feedback;
type SkeletonPalette = typeof lightPalette.skeleton;

declare module '@mui/material/styles' {
  interface Palette {
    brand: BrandPalette;
    status: StatusPalette;
    nav: NavPalette;
    tab: TabPalette;
    feedback: FeedbackPalette;
    skeleton: SkeletonPalette;
    shadowHard: string;
    scrim: string;
  }

  interface PaletteOptions {
    brand?: BrandPalette;
    status?: StatusPalette;
    nav?: NavPalette;
    tab?: TabPalette;
    feedback?: FeedbackPalette;
    skeleton?: SkeletonPalette;
    shadowHard?: string;
    scrim?: string;
  }

  interface TypographyVariants {
    displayXl: React.CSSProperties;
    display: React.CSSProperties;
    titleL: React.CSSProperties;
    titleM: React.CSSProperties;
    titleS: React.CSSProperties;
    bodyL: React.CSSProperties;
    bodyM: React.CSSProperties;
    bodyS: React.CSSProperties;
    labelL: React.CSSProperties;
    labelM: React.CSSProperties;
    labelS: React.CSSProperties;
    numeric: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    displayXl?: React.CSSProperties;
    display?: React.CSSProperties;
    titleL?: React.CSSProperties;
    titleM?: React.CSSProperties;
    titleS?: React.CSSProperties;
    bodyL?: React.CSSProperties;
    bodyM?: React.CSSProperties;
    bodyS?: React.CSSProperties;
    labelL?: React.CSSProperties;
    labelM?: React.CSSProperties;
    labelS?: React.CSSProperties;
    numeric?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    displayXl: true;
    display: true;
    titleL: true;
    titleM: true;
    titleS: true;
    bodyL: true;
    bodyM: true;
    bodyS: true;
    labelL: true;
    labelM: true;
    labelS: true;
    numeric: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    tonal: true;
    ghost: true;
    inverse: true;
  }
}

export const THEME_MODE_STORAGE_KEY = 'aaradhya-theme';

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-theme' },
  colorSchemes: {
    light: { palette: lightPalette },
    dark: { palette: darkPalette },
  },
  shape: { borderRadius: scaleTokens.radius.md },
  spacing: 4,
  typography,
  transitions: {
    duration: {
      shortest: motionTokens.duration.fast,
      shorter: motionTokens.duration.fast,
      short: motionTokens.duration.base,
      standard: motionTokens.duration.base,
      complex: motionTokens.duration.slow,
      enteringScreen: motionTokens.duration.base,
      leavingScreen: motionTokens.duration.fast,
    },
    easing: {
      easeInOut: motionTokens.easing.base,
      easeOut: motionTokens.easing.fast,
      easeIn: motionTokens.easing.slow,
      sharp: motionTokens.easing.slow,
    },
  },
  components,
});

// @mui/x-scheduler sizes its month view from theme.spacing and was laid out
// against MUI's default 8px unit; CalendarPage scopes it to that unit so the
// app-wide spacing: 4 doesn't compact the calendar grid.
const schedulerSpacing = createTheme({ spacing: 8 }).spacing;

export const withSchedulerSpacing = (outerTheme: Theme): Theme => ({ ...outerTheme, spacing: schedulerSpacing });
