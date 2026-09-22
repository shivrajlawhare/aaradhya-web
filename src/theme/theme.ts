import { createTheme } from '@mui/material/styles';
// Side-effecting only — registers MuiEventCalendar (StandaloneMonthView's
// own component family) as a valid `components` key/class-key set, so the
// override below type-checks. No named import: this module exists purely
// to run its own `declare module '@mui/material/styles'` augmentation.
import '@mui/x-scheduler/theme-augmentation';
// Same reasoning — registers MuiDatePicker (and friends) as a valid
// `components` key for the MuiDatePicker override below.
import '@mui/x-date-pickers/themeAugmentation';
import { colorTokens, fontFamilyTokens, radiusTokens } from './tokens';

// The story backlog's Tokens line names these six type-* variants directly on
// almost every screen — adding them as real MUI Typography variants means a
// component writes `variant="titleL"` instead of repeating an sx override
// per story.
declare module '@mui/material/styles' {
  interface TypographyVariants {
    display: React.CSSProperties;
    titleL: React.CSSProperties;
    titleM: React.CSSProperties;
    bodyL: React.CSSProperties;
    bodyM: React.CSSProperties;
    labelS: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    display?: React.CSSProperties;
    titleL?: React.CSSProperties;
    titleM?: React.CSSProperties;
    bodyL?: React.CSSProperties;
    bodyM?: React.CSSProperties;
    labelS?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    display: true;
    titleL: true;
    titleM: true;
    bodyL: true;
    bodyM: true;
    labelS: true;
  }
}

export const theme = createTheme({
  palette: {
    background: { default: colorTokens.bg, paper: colorTokens.surface },
    text: {
      primary: colorTokens.text,
      secondary: colorTokens.textSoft,
      disabled: colorTokens.textFaint,
    },
    primary: { main: colorTokens.accent, dark: colorTokens.accentDeep, contrastText: '#FFFFFF' },
    divider: colorTokens.line,
  },
  shape: {
    borderRadius: radiusTokens.radiusSm,
  },
  typography: {
    fontFamily: fontFamilyTokens.body,
    // Desktop/base sizes — theme.typography.<variant>.fontSize only accepts
    // a plain CSS value, not a breakpoint object (MUI merges these directly
    // into Typography's style, unlike the `sx` prop's responsive-value
    // resolver), so the below-`md` shrink is applied via the MuiTypography
    // styleOverrides.root callback further down instead.
    //
    // Not sized in docs/design/theme-tokens.md (wordmark-only, no spec value
    // yet) — 28px is a placeholder until the Figma build settles it.
    display: { fontFamily: fontFamilyTokens.display, fontWeight: 600, fontSize: 28 },
    titleL: { fontFamily: fontFamilyTokens.body, fontWeight: 600, fontSize: 22 },
    titleM: { fontFamily: fontFamilyTokens.body, fontWeight: 600, fontSize: 17 },
    bodyL: { fontFamily: fontFamilyTokens.body, fontWeight: 400, fontSize: 15 },
    bodyM: { fontFamily: fontFamilyTokens.body, fontWeight: 400, fontSize: 13 },
    labelS: {
      fontFamily: fontFamilyTokens.body,
      fontWeight: 600,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
  },
  components: {
    // DD/MM/YYYY everywhere — MUI's own default is MM/DD/YYYY. A `format`
    // default, not an `adapterLocale` on LocalizationProvider (main.tsx),
    // since a locale swap also changes week-start/month names.
    MuiDatePicker: {
      defaultProps: {
        format: 'DD/MM/YYYY',
      },
    },
    // One step smaller below `md` for every one of the six custom variants
    // above, so the whole app's type scales down on a phone without each
    // individual screen needing its own font-size override — the same
    // `({theme}) => ({[theme.breakpoints.down('md')]: {...}})` callback
    // shape MuiEventCalendar's own overrides below already use, since a
    // plain breakpoint-object fontSize isn't valid inside `typography.*`
    // itself (see the comment there).
    MuiTypography: {
      styleOverrides: {
        root: ({ ownerState, theme }) => {
          const mobileFontSize: Partial<Record<string, number>> = {
            display: 22,
            titleL: 18,
            titleM: 15,
            bodyL: 14,
            bodyM: 12,
            labelS: 10,
          };
          const size = ownerState.variant ? mobileFontSize[ownerState.variant] : undefined;
          if (size === undefined) {
            return {};
          }
          return {
            [theme.breakpoints.down('md')]: {
              fontSize: size,
            },
          };
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
        // This story's own AC: at mobile width, an event's time is
        // dropped entirely rather than left to compete with its title for
        // the same truncated line — the title alone gets the full width
        // and truncates on its own only if it still doesn't fit.
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
        // `min-width: auto` refuses to shrink below the title's
        // *unwrapped* content width (since dayGridEventTitle is
        // `white-space: nowrap`), so a long title was overflowing its
        // cell in visible, unclipped text instead of ever reaching its
        // own `overflow: hidden`/ellipsis above — a real layout bug this
        // story's mobile-width testing surfaced, not mobile-specific
        // itself (a long enough title could do the same on desktop), so
        // fixed unconditionally rather than only below `md`.
        dayGridEventCardWrapper: {
          minWidth: 0,
        },
        dayGridEventCardContent: {
          minWidth: 0,
        },
      },
    },
  },
});
