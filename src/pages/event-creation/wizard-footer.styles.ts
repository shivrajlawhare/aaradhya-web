import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { space, stroke, controlSize } = scaleTokens;

// Figma Wizard/Footer: Desktop = Back left, Next right, over a divider;
// Mobile = pinned to the bottom of the viewport, a round Back icon button
// beside a full-width Next so long "Next: …" labels fit.
export const footerStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[12]}px`,
  borderTop: { xs: 'none', md: `${stroke.hair}px solid ${paletteVar('divider')}` },
  pt: { xs: `${space[12]}px`, md: `${space[16]}px` },
  pb: { xs: `${space[16]}px`, md: 0 },
  position: { xs: 'sticky', md: 'static' },
  bottom: 0,
  zIndex: 1,
  bgcolor: { xs: 'background.default', md: 'transparent' },
};

export const spacerStyles: SxProps<Theme> = {
  flex: 1,
};

export const mobileBackStyles: SxProps<Theme> = {
  flexShrink: 0,
  width: controlSize.l,
  height: controlSize.l,
  border: `${stroke.default}px solid ${paletteVar('brand-borderStrong')}`,
};
