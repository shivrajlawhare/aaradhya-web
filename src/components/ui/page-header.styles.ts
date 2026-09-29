import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

// Figma `Page Header` (Layout=Desktop 1088×160, Layout=Mobile 358 wide).
export const pageHeaderStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  alignItems: { xs: 'stretch', md: 'center' },
  gap: { xs: `${space[12]}px`, md: `${space[24]}px` },
};

export const textColumnStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[4]}px`, md: `${space[8]}px` },
  flex: 1,
  minWidth: 0,
};

export const eyebrowStyles: SxProps<Theme> = {
  color: paletteVar('brand-link'),
};

export const titleStyles: SxProps<Theme> = {
  color: 'text.primary',
  overflowWrap: 'anywhere',
};

export const supportingTextStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

export const actionsStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${space[12]}px`,
  flexShrink: 0,
};

const DECOR_FRAME_WIDTH = 336;
const DECOR_HEIGHT = 160;
const DECOR_ART_WIDTH = 416;

// The 416-wide Decor/Page Header cluster, cropped by a 336-wide frame as in
// Figma. Desktop only: the mobile header stays text-first.
export const decorFrameStyles: SxProps<Theme> = {
  display: { xs: 'none', md: 'block' },
  position: 'relative',
  width: DECOR_FRAME_WIDTH,
  height: DECOR_HEIGHT,
  flexShrink: 0,
  overflow: 'hidden',
};

export const decorImageStyles: SxProps<Theme> = {
  display: 'block',
  width: DECOR_ART_WIDTH,
  height: DECOR_HEIGHT,
  maxWidth: 'none',
};
