import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

// AC: "a persistent, non-collapsible left rail, 280px wide".
export const DRAWER_WIDTH = 280;
// AC: "a top bar (56px)" — dark drawer-bg background, not the original
// surface/line recipe (see topBarStyles below).
export const TOP_BAR_HEIGHT = 56;

export const rootStyles: SxProps<Theme> = {
  display: 'flex',
  minHeight: '100vh',
};

export const railStyles: SxProps<Theme> = {
  width: DRAWER_WIDTH,
  flexShrink: 0,
  bgcolor: colorTokens.drawerBg,
  position: 'fixed',
  insetBlock: 0,
  left: 0,
  overflowY: 'auto',
};

export const desktopContentStyles: SxProps<Theme> = {
  flexGrow: 1,
  minWidth: 0,
  ml: `${DRAWER_WIDTH}px`,
};

export const desktopTitleStyles: SxProps<Theme> = {
  textAlign: 'center',
  pt: `${spaceTokens.space24}px`,
  px: `${spaceTokens.space24}px`,
};

export const mobileRootStyles: SxProps<Theme> = {
  flexGrow: 1,
  minWidth: 0,
};

// Dark, matching the rail/overlay — previously colorTokens.surface (white),
// the one place in the mobile layout that didn't match the rest of the
// shell's own dark-drawer branding.
export const topBarStyles: SxProps<Theme> = {
  position: 'sticky',
  top: 0,
  zIndex: (theme) => theme.zIndex.appBar,
  height: TOP_BAR_HEIGHT,
  display: 'flex',
  alignItems: 'center',
  bgcolor: colorTokens.drawerBg,
  px: `${spaceTokens.space8}px`,
};

// Same reasoning as topBarTitleStyles above — the hamburger icon's own
// inherited dark color would be invisible against the now-dark topBarStyles
// background.
export const menuButtonStyles: SxProps<Theme> = {
  color: colorTokens.drawerText,
};

export const topBarTitleStyles: SxProps<Theme> = {
  flexGrow: 1,
  textAlign: 'center',
  // Balances the hamburger IconButton's own width so the title sits
  // centered in the bar instead of shifted right by it.
  mr: '40px',
  // Inherited dark text.primary is unreadable against the now-dark
  // topBarStyles background — set explicitly, same fix closeButtonStyles
  // below already applies to the overlay's own icon.
  color: colorTokens.drawerText,
};

export const mobileOverlayStyles: SxProps<Theme> = {
  position: 'fixed',
  inset: 0,
  zIndex: (theme) => theme.zIndex.modal,
  bgcolor: colorTokens.drawerBg,
  overflowY: 'auto',
};

export const mobileOverlayHeaderStyles: SxProps<Theme> = {
  height: TOP_BAR_HEIGHT,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  px: `${spaceTokens.space8}px`,
};

// IconButton's own default icon color (near-black, for the light surface
// elsewhere in the app) reads as almost invisible against drawer-bg's dark
// charcoal — set explicitly rather than left to inherit.
export const closeButtonStyles: SxProps<Theme> = {
  color: colorTokens.drawerText,
};
