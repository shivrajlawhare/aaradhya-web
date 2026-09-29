// Design tokens from the Figma Theme / Scale collections (Handoff boards 02–05,
// docs/design/theme-tokens.md). theme.ts assembles these into the MUI theme.

export const lightPalette = {
  primary: { main: '#F77331', light: '#F88849', dark: '#E0591A', contrastText: '#200F07' },
  error: { main: '#C93A46', dark: '#A52D38', contrastText: '#FFFFFF' },
  warning: { main: '#E9A21F' },
  info: { main: '#3C7BD9' },
  success: { main: '#2E9E6A' },
  background: { default: '#FFF9EB', paper: '#FFFDF7' },
  text: { primary: '#200F07', secondary: '#5C4234', disabled: '#9A8475' },
  divider: '#EDE3D6',
  action: { hover: '#F6EFE8', selected: '#FEDFCC', disabledBackground: '#EDE3D6', disabled: '#9A8475' },
  brand: {
    subtle: '#FDF0D5',
    raised: '#FFFFFF',
    inverse: '#200F07',
    onInverse: '#FFF9EB',
    accentSubtle: '#FFF1E9',
    link: '#B94413',
    tertiary: '#7A6152',
    borderStrong: '#200F07',
    borderHover: '#9A8475',
    focus: '#F77331',
    tonal: '#FEDFCC',
    onTonal: '#5E220B',
    destructiveText: '#A52D38',
  },
  status: {
    tentative: { fg: '#5A3D05', bg: '#FCEFD0' },
    confirmed: { fg: '#0F3F28', bg: '#D8F2E4' },
    completed: { fg: '#432A1D', bg: '#EDE3D6' },
    cancelled: { fg: '#5C1219', bg: '#FBE0E2' },
  },
  nav: {
    bg: '#200F07',
    text: '#FFF9EB',
    textMuted: '#BBA99B',
    activeBg: '#F77331',
    activeText: '#200F07',
    hover: '#2E1A10',
  },
  tab: { activeBg: '#200F07', activeFg: '#FFF9EB' },
  feedback: {
    successBg: '#D8F2E4',
    successFg: '#0F3F28',
    errorBg: '#FBE0E2',
    errorFg: '#5C1219',
    warningBg: '#FCEFD0',
    warningFg: '#5A3D05',
    infoBg: '#DDE9FA',
    infoFg: '#12305C',
  },
  skeleton: { base: '#EDE3D6', highlight: '#F6EFE8' },
  shadowHard: '#200F07',
  scrim: '#200F077A',
};

export const darkPalette: typeof lightPalette = {
  primary: { main: '#F77331', light: '#F88849', dark: '#E0591A', contrastText: '#200F07' },
  error: { main: '#C93A46', dark: '#A52D38', contrastText: '#FFFFFF' },
  warning: { main: '#E9A21F' },
  info: { main: '#3C7BD9' },
  success: { main: '#2E9E6A' },
  background: { default: '#200F07', paper: '#2E1A10' },
  text: { primary: '#FFF9EB', secondary: '#D9CBBE', disabled: '#9A8475' },
  divider: '#432A1D',
  action: { hover: '#2E1A10', selected: '#5E220B', disabledBackground: '#432A1D', disabled: '#9A8475' },
  brand: {
    subtle: '#140904',
    raised: '#432A1D',
    inverse: '#FFF9EB',
    onInverse: '#200F07',
    accentSubtle: '#5E220B',
    link: '#F88849',
    tertiary: '#9A8475',
    borderStrong: '#FFF9EB',
    borderHover: '#7A6152',
    focus: '#F88849',
    tonal: '#5E220B',
    onTonal: '#FFF1E9',
    destructiveText: '#F29CA2',
  },
  status: {
    tentative: { fg: '#FCEFD0', bg: '#5A3D05' },
    confirmed: { fg: '#D8F2E4', bg: '#0F3F28' },
    completed: { fg: '#EDE3D6', bg: '#432A1D' },
    cancelled: { fg: '#FBE0E2', bg: '#5C1219' },
  },
  nav: {
    bg: '#140904',
    text: '#FFF9EB',
    textMuted: '#9A8475',
    activeBg: '#F77331',
    activeText: '#200F07',
    hover: '#2E1A10',
  },
  tab: { activeBg: '#F77331', activeFg: '#200F07' },
  feedback: {
    successBg: '#0F3F28',
    successFg: '#D8F2E4',
    errorBg: '#5C1219',
    errorFg: '#FBE0E2',
    warningBg: '#5A3D05',
    warningFg: '#FCEFD0',
    infoBg: '#12305C',
    infoFg: '#DDE9FA',
  },
  skeleton: { base: '#432A1D', highlight: '#5C4234' },
  shadowHard: '#8C3310',
  scrim: '#000000A3',
};

export const scaleTokens = {
  space: { 0: 0, 2: 2, 4: 4, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, 32: 32, 40: 40, 48: 48, 64: 64, 80: 80, 96: 96 },
  radius: { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, pill: 999 },
  stroke: { hair: 1, default: 1.5, bold: 2 },
  controlSize: { s: 32, m: 40, l: 48, touchMin: 44 },
  iconSize: { s: 16, m: 20, l: 24 },
};

// CSS custom properties MUI emits for the palette (cssVariables, prefix "mui").
// Reading them keeps a style correct in both colour schemes.
export const paletteVar = (path: string) => `var(--mui-palette-${path})`;

export const shadowTokens = {
  softSm: '0 2px 6px rgba(32, 15, 7, 0.08)',
  softMd: '0 8px 24px rgba(32, 15, 7, 0.12)',
  softLg: '0 20px 48px rgba(32, 15, 7, 0.14)',
  hardSm: `3px 3px 0 ${paletteVar('shadowHard')}`,
  hardMd: `6px 6px 0 ${paletteVar('shadowHard')}`,
};

export const focusTokens = {
  ring: `0 0 0 2px ${paletteVar('background-paper')}, 0 0 0 4px ${paletteVar('brand-focus')}`,
  input: '0 0 0 4px rgba(247, 115, 49, 0.24)',
};

export const motionTokens = {
  duration: { fast: 120, base: 220, slow: 320, spring: 400 },
  easing: {
    fast: 'ease-out',
    base: 'cubic-bezier(0.2, 0, 0, 1)',
    slow: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

export const fontFamilyTokens = {
  display: '"Bricolage Grotesque", "Inter", system-ui, sans-serif',
  body: '"Inter", system-ui, -apple-system, sans-serif',
  icon: '"Material Symbols Rounded"',
};

// Compatibility layer: the names page styles already import, now pointing at
// the new palette's CSS variables so they follow the light/dark scheme until
// each page is restyled.
export const colorTokens = {
  bg: paletteVar('background-default'),
  surface: paletteVar('background-paper'),
  surface2: paletteVar('brand-subtle'),
  text: paletteVar('text-primary'),
  textSoft: paletteVar('text-secondary'),
  textFaint: paletteVar('text-disabled'),
  line: paletteVar('divider'),
  drawerBg: paletteVar('nav-bg'),
  drawerText: paletteVar('nav-text'),
  drawerTextMuted: paletteVar('nav-textMuted'),
  accent: paletteVar('primary-main'),
  accentDeep: paletteVar('primary-dark'),
  accentTint: paletteVar('brand-tonal'),
  statusTentative: paletteVar('status-tentative-fg'),
  statusTentativeTint: paletteVar('status-tentative-bg'),
  statusConfirmed: paletteVar('status-confirmed-fg'),
  statusConfirmedTint: paletteVar('status-confirmed-bg'),
  statusCompleted: paletteVar('status-completed-fg'),
  statusCompletedTint: paletteVar('status-completed-bg'),
  statusCancelled: paletteVar('status-cancelled-fg'),
  statusCancelledTint: paletteVar('status-cancelled-bg'),
};

export const spaceTokens = {
  space4: scaleTokens.space[4],
  space8: scaleTokens.space[8],
  space12: scaleTokens.space[12],
  space16: scaleTokens.space[16],
  space24: scaleTokens.space[24],
  space32: scaleTokens.space[32],
};

export const radiusTokens = {
  radiusSm: scaleTokens.radius.sm,
  radiusMd: scaleTokens.radius.md,
  radiusLg: scaleTokens.radius.lg,
};
