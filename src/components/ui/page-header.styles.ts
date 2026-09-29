import type { SxProps, Theme } from '@mui/material';
import type { SystemStyleObject } from '@mui/system';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

// Figma `Page Header` (Layout=Desktop 1088×160, Layout=Mobile 358 wide).
export const pageHeaderStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: { xs: 'wrap', md: 'nowrap' },
  alignItems: 'center',
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

// On mobile the app shell's top bar already shows the page title, so a page
// can drop its own (Figma Page Header Mobile, title off).
export const titleStyles = (isHiddenOnMobile: boolean): SxProps<Theme> => ({
  display: { xs: isHiddenOnMobile ? 'none' : 'block', md: 'block' },
  color: 'text.primary',
  overflowWrap: 'anywhere',
});

export const supportingTextStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

// Beside the title on desktop; its own full-width row under the text and
// decor on mobile.
export const actionsStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${space[12]}px`,
  flexShrink: 0,
  order: { xs: 1, md: 0 },
  flexBasis: { xs: '100%', md: 'auto' },
};

// Figma crops the Decor/Page Header art in a frame beside the text: the
// 520×200 Desktop cluster at 416×160 in a 336-wide frame, the 390×120 Mobile
// cluster at 164×50 in a 124-wide frame.
const DESKTOP_FRAME_WIDTH = 336;
const DESKTOP_ART_WIDTH = 416;
const DESKTOP_HEIGHT = 160;
const MOBILE_FRAME_WIDTH = 124;
const MOBILE_ART_WIDTH = 164;
const MOBILE_HEIGHT = 50;

const decorFrameBase: SystemStyleObject<Theme> = {
  position: 'relative',
  flexShrink: 0,
  overflow: 'hidden',
  justifyContent: 'flex-end',
};

export const desktopDecorFrameStyles: SxProps<Theme> = {
  ...decorFrameBase,
  display: { xs: 'none', md: 'flex' },
  width: DESKTOP_FRAME_WIDTH,
  height: DESKTOP_HEIGHT,
};

export const mobileDecorFrameStyles: SxProps<Theme> = {
  ...decorFrameBase,
  display: { xs: 'flex', md: 'none' },
  width: MOBILE_FRAME_WIDTH,
  height: MOBILE_HEIGHT,
};

export const desktopDecorImageStyles: SxProps<Theme> = {
  flexShrink: 0,
  width: DESKTOP_ART_WIDTH,
  height: DESKTOP_HEIGHT,
  maxWidth: 'none',
};

export const mobileDecorImageStyles: SxProps<Theme> = {
  flexShrink: 0,
  width: MOBILE_ART_WIDTH,
  height: MOBILE_HEIGHT,
  maxWidth: 'none',
};
