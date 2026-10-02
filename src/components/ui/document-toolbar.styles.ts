import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { space, stroke } = scaleTokens;

export const TOOLBAR_DESKTOP_HEIGHT = 64;
const MOBILE_HEIGHT = 56;
const MARK_SIZE = 32;
const DIVIDER_HEIGHT = 28;

// Figma Quotation/Toolbar (also the Banquet Event Order toolbar): pinned
// over the canvas.
export const toolbarStyles: SxProps<Theme> = {
  position: 'sticky',
  top: 0,
  zIndex: (theme) => theme.zIndex.appBar,
  minHeight: { xs: MOBILE_HEIGHT, md: TOOLBAR_DESKTOP_HEIGHT },
  display: 'flex',
  alignItems: 'center',
  gap: { xs: `${space[8]}px`, md: `${space[16]}px` },
  px: { xs: `${space[8]}px`, md: `${space[40]}px` },
  bgcolor: 'background.default',
  borderBottom: `${stroke.hair}px solid ${paletteVar('divider')}`,
};

export const markStyles: SxProps<Theme> = {
  width: MARK_SIZE,
  height: MARK_SIZE,
  flexShrink: 0,
};

export const dividerStyles: SxProps<Theme> = {
  width: `${stroke.hair}px`,
  height: DIVIDER_HEIGHT,
  bgcolor: paletteVar('divider'),
  flexShrink: 0,
};

export const titleBlockStyles: SxProps<Theme> = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
};

export const titleStyles: SxProps<Theme> = {
  whiteSpace: 'nowrap',
};

export const eventIdStyles: SxProps<Theme> = {
  color: 'text.secondary',
  whiteSpace: 'nowrap',
};

export const spacerStyles: SxProps<Theme> = {
  flex: 1,
};

// The mobile action (Share PDF / Download PDF): a Tonal icon button.
export const mobileActionStyles: SxProps<Theme> = {
  bgcolor: paletteVar('brand-tonal'),
  color: paletteVar('brand-onTonal'),
  '&:hover': { bgcolor: paletteVar('action-selected') },
};
