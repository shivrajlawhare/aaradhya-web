import { Button, ThemeProvider, Typography, type TypographyProps, useColorScheme } from '@mui/material';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { theme, THEME_MODE_STORAGE_KEY } from '../../src/theme/theme';
import { colorTokens, darkPalette, lightPalette } from '../../src/theme/tokens';
import { emittedCss, emittedRule } from '../support/emitted-css';

type CustomPaletteKey = 'brand' | 'status' | 'nav' | 'tab' | 'feedback' | 'skeleton' | 'shadowHard' | 'scrim';

interface TypographyExpectation {
  variant: NonNullable<TypographyProps['variant']>;
  fontSize: string;
  fontWeight: string;
}

const CUSTOM_PALETTE_KEYS: CustomPaletteKey[] = [
  'brand',
  'status',
  'nav',
  'tab',
  'feedback',
  'skeleton',
  'shadowHard',
  'scrim',
];

const TYPOGRAPHY_VARIANTS: TypographyExpectation[] = [
  { variant: 'displayXl', fontSize: '72px', fontWeight: '800' },
  { variant: 'display', fontSize: '56px', fontWeight: '800' },
  { variant: 'titleL', fontSize: '28px', fontWeight: '700' },
  { variant: 'titleM', fontSize: '22px', fontWeight: '600' },
  { variant: 'titleS', fontSize: '18px', fontWeight: '600' },
  { variant: 'bodyL', fontSize: '16px', fontWeight: '400' },
  { variant: 'bodyM', fontSize: '14px', fontWeight: '400' },
  { variant: 'bodyS', fontSize: '12px', fontWeight: '400' },
  { variant: 'labelL', fontSize: '15px', fontWeight: '600' },
  { variant: 'labelM', fontSize: '13px', fontWeight: '600' },
  { variant: 'labelS', fontSize: '11px', fontWeight: '700' },
  { variant: 'numeric', fontSize: '16px', fontWeight: '600' },
];

const ModeSwitch = () => {
  const { mode, setMode } = useColorScheme();
  return <Button onClick={() => setMode('dark')}>{`mode: ${mode}`}</Button>;
};

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('theme palette', () => {
  it.each(CUSTOM_PALETTE_KEYS)('defines the custom "%s" key on the light palette', (key) => {
    expect(theme.palette[key]).toEqual(lightPalette[key]);
  });

  it('emits the dark scheme values under [data-theme="dark"]', () => {
    render(
      <ThemeProvider theme={theme}>
        <Typography>dark scheme</Typography>
      </ThemeProvider>
    );

    const dark = emittedRule('[data-theme="dark"]');
    expect(dark).toContain(`--mui-palette-background-default:${darkPalette.background.default}`);
    expect(dark).toContain(`--mui-palette-text-primary:${darkPalette.text.primary}`);
    expect(dark).toContain(`--mui-palette-brand-subtle:${darkPalette.brand.subtle}`);
    expect(dark).toContain(`--mui-palette-nav-bg:${darkPalette.nav.bg}`);
    expect(dark).toContain(`--mui-palette-shadowHard:${darkPalette.shadowHard}`);
  });

  it('points the compatibility colour tokens at the palette CSS variables the theme emits', () => {
    const variableName = (value: string) => value.match(/--[\w-]+/)?.[0];

    expect(variableName(colorTokens.accent)).toBe(variableName(theme.vars.palette.primary.main));
    expect(variableName(colorTokens.surface)).toBe(variableName(theme.vars.palette.background.paper));
    expect(variableName(colorTokens.line)).toBe(variableName(theme.vars.palette.divider));
    expect(variableName(colorTokens.drawerTextMuted)).toBe(variableName(theme.vars.palette.nav.textMuted));
    expect(variableName(colorTokens.statusConfirmedTint)).toBe(variableName(theme.vars.palette.status.confirmed.bg));
  });

  it('uses a 4px spacing unit', () => {
    expect(theme.spacing(4)).toBe('calc(4 * var(--mui-spacing, 4px))');
  });
});

describe('theme mode', () => {
  it('defaults to light and switches data-theme to dark, persisting the choice', async () => {
    render(
      <ThemeProvider theme={theme} defaultMode="light" modeStorageKey={THEME_MODE_STORAGE_KEY}>
        <ModeSwitch />
      </ThemeProvider>
    );

    expect(screen.getByRole('button', { name: 'mode: light' })).toBeInTheDocument();

    await act(async () => {
      screen.getByRole('button').click();
    });

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('dark');
    expect(emittedCss()).toContain('[data-theme="dark"]');
  });
});

describe('theme typography', () => {
  it.each(TYPOGRAPHY_VARIANTS)('renders the $variant variant at $fontSize', ({ variant, fontSize, fontWeight }) => {
    render(
      <ThemeProvider theme={theme}>
        <Typography variant={variant}>{variant}</Typography>
      </ThemeProvider>
    );

    expect(screen.getByText(variant)).toHaveStyle({ fontSize, fontWeight });
  });
});
