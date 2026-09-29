import type { AlertColor } from '@mui/material';
import type { Components, Theme } from '@mui/material/styles';
import { focusTokens, motionTokens, paletteVar, scaleTokens, shadowTokens } from './tokens';
import { typography } from './typography';

// Handoff board 06: global overrides so page code keeps using plain MUI
// components. Colours read the palette CSS variables, so every override
// follows the light/dark scheme.

const { radius, stroke, controlSize } = scaleTokens;
const px = (value: number) => `${value}px`;
const border = (width: number, colorPath: string) => `${px(width)} solid ${paletteVar(colorPath)}`;
const transition = (properties: string[]) =>
  properties.map((property) => `${property} ${motionTokens.duration.base}ms ${motionTokens.easing.base}`).join(', ');

const alertSeverities: AlertColor[] = ['success', 'error', 'warning', 'info'];

const buttonColors = (background: string, color: string, borderColor = 'transparent') => ({
  backgroundColor: background,
  color,
  borderColor,
});

export const components: Components<Omit<Theme, 'components'>> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: paletteVar('background-default'),
        color: paletteVar('text-primary'),
      },
      '.material-symbols-rounded': {
        fontVariationSettings: '"FILL" 0, "wght" 500, "GRAD" 0, "opsz" 24',
      },
      '@media (prefers-reduced-motion: reduce)': {
        '*, *::before, *::after': {
          animationDuration: '0.01ms !important',
          animationIterationCount: '1 !important',
          transitionDuration: '0.01ms !important',
          scrollBehavior: 'auto !important',
        },
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        ...typography.labelM,
        borderRadius: px(radius.pill),
        border: `${px(stroke.bold)} solid transparent`,
        gap: px(8),
        transition: transition(['background-color', 'border-color', 'color', 'box-shadow', 'transform']),
        '&:active': { transform: 'scale(0.97)' },
        '&.Mui-focusVisible': { boxShadow: focusTokens.ring },
        '&.Mui-disabled': buttonColors(paletteVar('action-disabledBackground'), paletteVar('action-disabled')),
      },
      sizeSmall: { minHeight: px(controlSize.s), padding: '0 16px' },
      sizeMedium: { minHeight: px(controlSize.m), padding: '0 20px' },
      sizeLarge: { ...typography.labelL, minHeight: px(controlSize.l), padding: '0 24px' },
      outlined: {
        border: border(stroke.default, 'brand-borderStrong'),
        color: paletteVar('text-primary'),
        '&:hover': {
          backgroundColor: paletteVar('action-hover'),
          border: border(stroke.default, 'brand-borderStrong'),
        },
      },
      text: {
        color: paletteVar('text-primary'),
        '&:hover': { backgroundColor: paletteVar('action-hover') },
      },
    },
    variants: [
      {
        props: { variant: 'contained', color: 'primary' },
        style: {
          ...buttonColors(
            paletteVar('primary-main'),
            paletteVar('primary-contrastText'),
            paletteVar('brand-borderStrong')
          ),
          '&:hover': { backgroundColor: paletteVar('primary-light') },
          '&:active': { backgroundColor: paletteVar('primary-dark') },
        },
      },
      {
        props: { variant: 'contained', size: 'large' },
        style: { boxShadow: shadowTokens.hardSm },
      },
      {
        props: { variant: 'contained', color: 'error' },
        style: {
          ...buttonColors(paletteVar('error-main'), paletteVar('error-contrastText')),
          '&:hover': { backgroundColor: paletteVar('error-dark') },
        },
      },
      {
        props: { variant: 'outlined', color: 'error' },
        style: {
          border: border(stroke.default, 'error-main'),
          color: paletteVar('brand-destructiveText'),
          '&:hover': { border: border(stroke.default, 'error-main') },
        },
      },
      {
        props: { variant: 'tonal' },
        style: {
          ...buttonColors(paletteVar('brand-tonal'), paletteVar('brand-onTonal')),
          '&:hover': { backgroundColor: paletteVar('action-selected') },
        },
      },
      {
        props: { variant: 'ghost' },
        style: {
          color: paletteVar('text-primary'),
          '&:hover': { backgroundColor: paletteVar('action-hover') },
        },
      },
      {
        props: { variant: 'inverse' },
        style: {
          ...buttonColors(paletteVar('brand-inverse'), paletteVar('brand-onInverse')),
          '&:hover': { backgroundColor: paletteVar('brand-tertiary') },
        },
      },
    ],
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: px(radius.pill),
        color: paletteVar('text-primary'),
        '&.Mui-focusVisible': { boxShadow: focusTokens.ring },
      },
      sizeSmall: { width: px(controlSize.s), height: px(controlSize.s) },
      sizeMedium: { width: px(controlSize.m), height: px(controlSize.m) },
    },
  },
  MuiTextField: {
    defaultProps: {
      slotProps: { inputLabel: { shrink: true } },
    },
  },
  MuiInputLabel: {
    defaultProps: {
      shrink: true,
    },
    styleOverrides: {
      root: {
        ...typography.labelM,
        position: 'relative',
        transform: 'none',
        marginBottom: px(6),
        color: paletteVar('text-secondary'),
        '&.Mui-focused': { color: paletteVar('text-secondary') },
        '&.Mui-error': { color: paletteVar('brand-destructiveText') },
      },
    },
  },
  MuiOutlinedInput: {
    defaultProps: {
      notched: false,
    },
    styleOverrides: {
      root: {
        minHeight: px(controlSize.l),
        borderRadius: px(radius.md),
        backgroundColor: paletteVar('background-paper'),
        transition: transition(['box-shadow']),
        '& .MuiOutlinedInput-notchedOutline': { border: border(stroke.default, 'divider') },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: paletteVar('brand-borderHover') },
        '&.Mui-focused': { boxShadow: focusTokens.input },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: border(stroke.bold, 'brand-focus') },
        '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: paletteVar('brand-destructiveText') },
      },
      sizeSmall: { minHeight: px(controlSize.m) },
    },
  },
  MuiFormHelperText: {
    styleOverrides: {
      root: {
        ...typography.bodyS,
        marginLeft: 0,
        '&.Mui-error': { color: paletteVar('brand-destructiveText') },
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: px(radius.md),
        boxShadow: shadowTokens.softMd,
        border: border(stroke.hair, 'divider'),
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        ...typography.bodyM,
        minHeight: px(controlSize.m),
        '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: paletteVar('brand-accentSubtle') },
        '&:hover': { backgroundColor: paletteVar('action-hover') },
      },
    },
  },
  MuiAutocomplete: {
    styleOverrides: {
      paper: {
        borderRadius: px(radius.md),
        boxShadow: shadowTokens.softMd,
      },
      tag: {
        height: px(controlSize.s),
        borderRadius: px(radius.pill),
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        ...typography.labelM,
        borderRadius: px(radius.pill),
      },
      sizeSmall: { height: px(24) },
      sizeMedium: { height: px(controlSize.s) },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: {
        width: px(44),
        height: px(24),
        padding: 0,
      },
      switchBase: {
        padding: px(3),
        transition: transition(['transform']),
        '&.Mui-checked': {
          transform: 'translateX(20px)',
          color: paletteVar('primary-contrastText'),
          '& + .MuiSwitch-track': {
            backgroundColor: paletteVar('primary-main'),
            border: border(stroke.default, 'brand-borderStrong'),
            opacity: 1,
          },
        },
      },
      thumb: {
        width: px(18),
        height: px(18),
        boxShadow: 'none',
      },
      track: {
        borderRadius: px(radius.pill),
        backgroundColor: paletteVar('action-disabledBackground'),
        border: border(stroke.default, 'brand-borderHover'),
        opacity: 1,
        transition: transition(['background-color']),
      },
    },
  },
  MuiCheckbox: {
    defaultProps: {
      color: 'primary',
    },
  },
  MuiRadio: {
    defaultProps: {
      color: 'primary',
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: {
        ...typography.labelM,
        textTransform: 'none',
        borderRadius: px(radius.pill),
        border: border(stroke.default, 'brand-borderStrong'),
        color: paletteVar('text-primary'),
        '&.Mui-selected, &.Mui-selected:hover': {
          backgroundColor: paletteVar('brand-inverse'),
          color: paletteVar('brand-onInverse'),
        },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        minHeight: px(controlSize.m),
        padding: px(4),
        borderRadius: px(radius.pill),
        backgroundColor: paletteVar('brand-subtle'),
      },
      indicator: { display: 'none' },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        ...typography.labelM,
        textTransform: 'none',
        minHeight: px(controlSize.m - 8),
        borderRadius: px(radius.pill),
        color: paletteVar('text-secondary'),
        '&.Mui-selected': {
          backgroundColor: paletteVar('tab-activeBg'),
          color: paletteVar('tab-activeFg'),
        },
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        '& .MuiTableCell-head': {
          ...typography.labelS,
          backgroundColor: paletteVar('brand-subtle'),
          color: paletteVar('text-secondary'),
        },
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&.MuiTableRow-hover:hover': { backgroundColor: paletteVar('brand-accentSubtle') },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: border(stroke.hair, 'divider'),
      },
      body: {
        ...typography.bodyM,
        height: px(56),
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      outlined: {
        border: border(stroke.default, 'divider'),
        borderRadius: px(radius.lg),
      },
    },
  },
  MuiCard: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        backgroundColor: paletteVar('background-paper'),
        border: border(stroke.default, 'divider'),
        borderRadius: px(radius.lg),
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: px(radius.xl),
        border: border(stroke.default, 'brand-borderStrong'),
        boxShadow: shadowTokens.hardMd,
        '@media (max-width:899.95px)': {
          margin: 0,
          width: '100%',
          maxWidth: '100%',
          alignSelf: 'flex-end',
          borderRadius: `${px(radius.xl)} ${px(radius.xl)} 0 0`,
        },
      },
    },
  },
  MuiBackdrop: {
    styleOverrides: {
      root: {
        '&:not(.MuiBackdrop-invisible)': { backgroundColor: paletteVar('scrim') },
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundImage: 'none',
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        ...typography.bodyM,
        borderRadius: px(radius.md),
      },
    },
    variants: alertSeverities.map((severity) => ({
      props: { variant: 'standard', severity },
      style: {
        backgroundColor: paletteVar(`feedback-${severity}Bg`),
        color: paletteVar(`feedback-${severity}Fg`),
      },
    })),
  },
  MuiSnackbarContent: {
    styleOverrides: {
      root: {
        backgroundColor: paletteVar('brand-inverse'),
        color: paletteVar('brand-onInverse'),
        borderRadius: px(radius.md),
      },
    },
  },
  MuiCircularProgress: {
    defaultProps: {
      color: 'primary',
    },
    styleOverrides: {
      root: { animationDuration: '720ms' },
    },
  },
  MuiSkeleton: {
    defaultProps: {
      animation: 'wave',
    },
    styleOverrides: {
      root: {
        backgroundColor: paletteVar('skeleton-base'),
        '&::after': {
          background: `linear-gradient(90deg, transparent, ${paletteVar('skeleton-highlight')}, transparent)`,
        },
      },
    },
  },
  // DD/MM/YYYY everywhere — MUI's own default is MM/DD/YYYY. A `format`
  // default, not an `adapterLocale` on LocalizationProvider (main.tsx),
  // since a locale swap also changes week-start/month names.
  MuiDatePicker: {
    defaultProps: {
      format: 'DD/MM/YYYY',
    },
  },
  // The pickers size these from theme.spacing; pinned to their px values so
  // spacing: 4 doesn't shrink them.
  MuiPickersToolbar: {
    styleOverrides: {
      root: { padding: '16px 24px' },
    },
  },
  MuiPickersArrowSwitcher: {
    styleOverrides: {
      spacer: { width: px(24) },
    },
  },
  MuiClock: {
    styleOverrides: {
      root: { margin: px(16) },
      clock: { backgroundColor: paletteVar('brand-subtle') },
      pin: { backgroundColor: paletteVar('primary-main') },
    },
  },
  MuiClockPointer: {
    styleOverrides: {
      root: { backgroundColor: paletteVar('primary-main') },
      thumb: { backgroundColor: paletteVar('primary-main'), borderColor: paletteVar('primary-main') },
    },
  },
  MuiPickerDay: {
    styleOverrides: {
      root: {
        width: px(controlSize.m),
        height: px(controlSize.m),
        '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected:focus': {
          backgroundColor: paletteVar('primary-main'),
          color: paletteVar('primary-contrastText'),
        },
      },
    },
  },
  MuiEventCalendar: {
    styleOverrides: {
      // StandaloneMonthView's own weekday header always renders the
      // date-fns 'ccc' format ("Mon", "Tue", ...) — there's no prop to
      // shorten it to a single letter, so CalendarPage (STORY-059) hides
      // this one below `md` and renders its own single-letter row
      // instead, rather than fighting the library's fixed format string.
      monthViewHeader: ({ theme }) => ({
        [theme.breakpoints.down('md')]: {
          display: 'none',
        },
      }),
      // At mobile width, an event's time is dropped entirely rather than
      // left to compete with its title for the same truncated line — the
      // title alone gets the full width and truncates on its own only if it
      // still doesn't fit.
      dayGridEventTime: ({ theme }) => ({
        [theme.breakpoints.down('md')]: {
          display: 'none',
        },
      }),
      dayGridEventTitle: ({ theme }) => ({
        minWidth: 0,
        [theme.breakpoints.down('md')]: {
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      }),
      // Both are flex items upstream of the title; their own default
      // `min-width: auto` refuses to shrink below the title's unwrapped
      // content width (since dayGridEventTitle is `white-space: nowrap`), so
      // a long title overflowed its cell instead of reaching its own
      // `overflow: hidden`/ellipsis above.
      dayGridEventCardWrapper: {
        minWidth: 0,
      },
      dayGridEventCardContent: {
        minWidth: 0,
      },
    },
  },
};
