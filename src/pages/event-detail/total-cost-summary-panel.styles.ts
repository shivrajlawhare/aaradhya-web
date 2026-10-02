import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens, shadowTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

// Figma Panel/Cost Summary: a raised card with the hard brand border and
// shadow, line items as label / value rows, the Extras block, and the
// orange Grand Total tile.
export const panelStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('brand-borderStrong')}`,
  borderRadius: `${radius.lg}px`,
  boxShadow: shadowTokens.hardMd,
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
};

export const lineItemsStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[8]}px`,
  m: 0,
};

export const lineItemStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: `${space[16]}px`,
};

export const lineLabelStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

export const lineValueStyles: SxProps<Theme> = {
  m: 0,
  fontVariantNumeric: 'tabular-nums',
};

export const extrasStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[12]}px`,
  pt: `${space[16]}px`,
  borderTop: `${stroke.hair}px solid ${paletteVar('divider')}`,
};

export const extrasLabelStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

export const saveButtonStyles: SxProps<Theme> = {
  alignSelf: { xs: 'stretch', md: 'flex-start' },
};

// The orange hero tile. A very large amount wraps rather than overflowing.
export const grandTotalTileStyles: SxProps<Theme> = {
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  border: `${stroke.default}px solid ${paletteVar('brand-borderStrong')}`,
  borderRadius: `${radius.md}px`,
  px: `${space[20]}px`,
  py: `${space[16]}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[4]}px`,
};

export const grandTotalValueStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
  overflowWrap: 'break-word',
  maxWidth: '100%',
};
