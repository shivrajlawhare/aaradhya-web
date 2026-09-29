import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';
import { navFocusRing } from './app-shell-nav.styles';

const { controlSize, space, stroke } = scaleTokens;

export const SIDEBAR_WIDTH = 272;
export const TOP_BAR_HEIGHT = 64;
// Nav/Mobile Overlay: slides in from the left (slow), leaves faster (base).
export const OVERLAY_TRANSITION = { enter: 320, exit: 220 };

export const rootStyles: SxProps<Theme> = {
  display: 'flex',
  minHeight: '100vh',
};

export const sidebarStyles: SxProps<Theme> = {
  width: SIDEBAR_WIDTH,
  flexShrink: 0,
  bgcolor: paletteVar('nav-bg'),
  position: 'fixed',
  insetBlock: 0,
  left: 0,
  overflowX: 'hidden',
  overflowY: 'auto',
  px: `${space[16]}px`,
  py: `${space[24]}px`,
};

// Motif/Quarter Circle in the sidebar's top-right corner.
export const sidebarDecorStyles: SxProps<Theme> = {
  position: 'absolute',
  top: 0,
  right: 0,
  width: 132,
  height: 132,
  borderBottomLeftRadius: '100%',
  bgcolor: paletteVar('nav-hover'),
  pointerEvents: 'none',
};

export const sidebarContentStyles: SxProps<Theme> = {
  position: 'relative',
  minHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
};

export const desktopContentStyles: SxProps<Theme> = {
  flexGrow: 1,
  minWidth: 0,
  ml: `${SIDEBAR_WIDTH}px`,
};

export const desktopTitleStyles: SxProps<Theme> = {
  textAlign: 'center',
  pt: `${space[24]}px`,
  px: `${space[24]}px`,
};

export const mobileRootStyles: SxProps<Theme> = {
  flexGrow: 1,
  minWidth: 0,
};

export const topBarStyles: SxProps<Theme> = {
  position: 'sticky',
  top: 0,
  zIndex: (theme) => theme.zIndex.appBar,
  height: TOP_BAR_HEIGHT,
  display: 'flex',
  alignItems: 'center',
  gap: `${space[8]}px`,
  px: `${space[12]}px`,
  bgcolor: paletteVar('background-default'),
  borderBottom: `${stroke.hair}px solid ${paletteVar('divider')}`,
};

export const topBarTitleSlotStyles: SxProps<Theme> = {
  flexGrow: 1,
  minWidth: 0,
};

export const topBarTitleStyles: SxProps<Theme> = {
  textAlign: 'center',
  color: paletteVar('text-primary'),
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

// Keeps the title centred opposite the menu button.
export const topBarSpacerStyles: SxProps<Theme> = {
  width: controlSize.m,
  flexShrink: 0,
};

export const overlayPaperStyles: SxProps<Theme> = {
  width: '100%',
  bgcolor: paletteVar('nav-bg'),
  backgroundImage: 'none',
  pt: `${space[12]}px`,
  px: `${space[16]}px`,
  pb: `${space[24]}px`,
};

export const overlayHeaderStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[12]}px`,
};

export const overlayLogoStyles: SxProps<Theme> = {
  display: 'block',
  width: 180,
  height: 'auto',
};

// Icon Button, Variant=Inverse: a light disc on the dark overlay.
export const closeButtonStyles: SxProps<Theme> = {
  bgcolor: paletteVar('nav-text'),
  color: paletteVar('nav-activeText'),
  '&:hover': { bgcolor: paletteVar('nav-textMuted') },
  '&.Mui-focusVisible': navFocusRing,
};
