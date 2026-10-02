import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

// The page-header decor cluster at half scale (Figma Event Detail/Header).
const DECOR_WIDTH = 260;
const DECOR_HEIGHT = 100;

export const headerCardStyles: SxProps<Theme> = {
  position: 'relative',
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[8]}px`, md: `${space[16]}px` },
  overflow: 'hidden',
};

export const mobileHeaderStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[8]}px`,
};

export const identityRowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: `${space[12]}px`,
};

export const identityStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[4]}px`,
  minWidth: 0,
  position: 'relative',
  zIndex: 1,
};

export const eyebrowStyles: SxProps<Theme> = {
  color: paletteVar('brand-link'),
};

export const titleRowStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: `${space[12]}px`,
  rowGap: `${space[4]}px`,
};

export const titleStyles: SxProps<Theme> = {
  overflowWrap: 'anywhere',
};

export const familyTypeStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

export const decorStyles: SxProps<Theme> = {
  display: { xs: 'none', md: 'block' },
  position: 'absolute',
  top: `${space[16]}px`,
  right: `${space[24]}px`,
  width: DECOR_WIDTH,
  height: DECOR_HEIGHT,
  pointerEvents: 'none',
};

// Notes for Department (DEV-12) · Delete Event, right-aligned over the strip.
export const actionsStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: `${space[8]}px`,
  position: 'relative',
  zIndex: 1,
};

export const decorImageStyles: SxProps<Theme> = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  objectPosition: 'right top',
};
