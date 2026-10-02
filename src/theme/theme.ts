import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
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

const themeOptions: ThemeOptions = {
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
      // Dialog / drawer / bottom sheet (Figma Motion Spec): enter at
      // motion/slow, exit at motion/base.
      enteringScreen: motionTokens.duration.slow,
      leavingScreen: motionTokens.duration.base,
    },
    easing: {
      easeInOut: motionTokens.easing.base,
      easeOut: motionTokens.easing.fast,
      easeIn: motionTokens.easing.slow,
      sharp: motionTokens.easing.slow,
    },
  },
  components,
};

export const theme = createTheme(themeOptions);

// Under prefers-reduced-motion (Figma Motion Spec rule): every MUI
// transition is instant — zero durations, and `create` emits no CSS
// transition — so dialogs, drawers, menus and collapses just appear. CSS
// keyframe animations are switched off by the global rule in components.ts.
export const reducedMotionTheme = createTheme({
  ...themeOptions,
  transitions: {
    ...themeOptions.transitions,
    duration: {
      shortest: 0,
      shorter: 0,
      short: 0,
      standard: 0,
      complex: 0,
      enteringScreen: 0,
      leavingScreen: 0,
    },
    create: () => 'none',
  },
});

// @mui/x-scheduler sizes its month view from theme.spacing and was laid out
// against MUI's default 8px unit; CalendarPage scopes it to that unit so the
// app-wide spacing: 4 doesn't compact the calendar grid.
const schedulerSpacing = createTheme({ spacing: 8 }).spacing;

export const withSchedulerSpacing = (outerTheme: Theme): Theme => ({ ...outerTheme, spacing: schedulerSpacing });
