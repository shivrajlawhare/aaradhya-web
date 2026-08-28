import { createTheme } from '@mui/material/styles';
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
});
