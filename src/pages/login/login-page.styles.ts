import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens, shadowTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

// Figma 01 Login: a split screen from md up (hero panel 792 of 1440, i.e.
// 55%); below md an espresso hero band with the card overlapping it.
export const pageStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  minHeight: '100dvh',
  bgcolor: 'background.default',
};

// ── Desktop hero panel ──────────────────────────────────────────────────
const HERO_PANEL_SHARE = '55%';
const HERO_TOP_INSET = 150;
const HERO_BOTTOM_INSET = 100;
const HERO_GAP = 62;
const HERO_ART_MAX_WIDTH = 480;
const HERO_ART_MAX_HEIGHT = 560;

export const heroPanelStyles: SxProps<Theme> = {
  display: { xs: 'none', md: 'flex' },
  flexDirection: 'column',
  flex: `0 0 ${HERO_PANEL_SHARE}`,
  position: 'relative',
  overflow: 'hidden',
  gap: `${HERO_GAP}px`,
  pt: `${HERO_TOP_INSET}px`,
  pb: `${HERO_BOTTOM_INSET}px`,
  px: `${space[64]}px`,
  bgcolor: paletteVar('nav-bg'),
};

// Decor/Login with only Toran, Sparkle and Squiggle visible (UI-12).
export const heroDecorStyles: SxProps<Theme> = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center top',
};

export const heroArtFrameStyles: SxProps<Theme> = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  flex: '1 1 auto',
  minHeight: 0,
};

export const heroArtStyles: SxProps<Theme> = {
  height: '100%',
  maxHeight: HERO_ART_MAX_HEIGHT,
  maxWidth: HERO_ART_MAX_WIDTH,
  width: 'auto',
};

export const headlineStyles: SxProps<Theme> = {
  position: 'relative',
  color: paletteVar('nav-text'),
  whiteSpace: 'pre-line',
};

// ── Mobile hero band ────────────────────────────────────────────────────
const BAND_HEIGHT = 280;
const CARD_OVERLAP = 44;

export const heroBandStyles: SxProps<Theme> = {
  display: { xs: 'block', md: 'none' },
  position: 'relative',
  flexShrink: 0,
  height: BAND_HEIGHT,
  overflow: 'hidden',
  bgcolor: paletteVar('nav-bg'),
};

export const bandToranStyles: SxProps<Theme> = {
  position: 'absolute',
  top: 0,
  left: -25,
  width: 455,
  height: 101,
  maxWidth: 'none',
};

export const bandLockupStyles: SxProps<Theme> = {
  position: 'absolute',
  top: 118,
  left: 8,
  width: 170,
};

export const bandArtStyles: SxProps<Theme> = {
  position: 'absolute',
  top: 64,
  right: 8,
  width: 211,
  height: 246,
};

export const bandSparkleStyles: SxProps<Theme> = {
  position: 'absolute',
  top: 200,
  left: 40,
  width: 26,
  height: 26,
};

// ── Form side ───────────────────────────────────────────────────────────
export const formPanelStyles: SxProps<Theme> = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: { xs: 'flex-start', md: 'center' },
  flex: 1,
  px: { xs: `${space[16]}px`, md: `${space[24]}px` },
  pb: { xs: `${space[24]}px`, md: `${space[24]}px` },
  pt: { xs: 0, md: `${space[24]}px` },
};

export const formSparkleStyles: SxProps<Theme> = {
  display: { xs: 'none', md: 'block' },
  position: 'absolute',
  top: 72,
  right: 40,
  width: 48,
  height: 48,
};

const CARD_MAX_WIDTH = 460;

export const cardStyles: SxProps<Theme> = {
  position: 'relative',
  width: '100%',
  maxWidth: CARD_MAX_WIDTH,
  mt: { xs: `-${CARD_OVERLAP}px`, md: 0 },
  p: { xs: `${space[24]}px`, md: `${space[40]}px` },
  bgcolor: paletteVar('brand-raised'),
  border: `${stroke.bold}px solid ${paletteVar('brand-borderStrong')}`,
  borderRadius: `${radius.xl}px`,
  boxShadow: shadowTokens.hardMd,
};

export const fieldStackStyles: SxProps<Theme> = {
  gap: { xs: `${space[16]}px`, md: `${space[20]}px` },
};

const LOGO_MARK_HEIGHT = 56;

export const logoMarkFrameStyles: SxProps<Theme> = {
  display: { xs: 'none', md: 'block' },
};

export const logoMarkStyles: SxProps<Theme> = {
  height: LOGO_MARK_HEIGHT,
  width: 'auto',
};

export const headingStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[4]}px`,
};

export const subtitleStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

// Squiggle + rosette under the card on mobile.
export const mobileAccentsStyles: SxProps<Theme> = {
  display: { xs: 'flex', md: 'none' },
  alignItems: 'center',
  justifyContent: 'center',
  gap: `${space[12]}px`,
  mt: 'auto',
  pt: `${space[40]}px`,
};

export const squiggleStyles: SxProps<Theme> = {
  width: 146,
  height: 26,
};

export const rosetteStyles: SxProps<Theme> = {
  width: 48,
  height: 48,
};
