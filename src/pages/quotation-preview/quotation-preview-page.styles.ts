import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens, shadowTokens } from '../../theme/tokens';
import { PAPER_COLORS } from './quotation-document.styles';
import { TOOLBAR_DESKTOP_HEIGHT } from './quotation-toolbar.styles';

const { radius, space, stroke } = scaleTokens;

const SIDE_COLUMN_WIDTH = 360;

export const pageStyles: SxProps<Theme> = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  bgcolor: paletteVar('brand-subtle'),
};

// Figma 06 Quotation Preview: the bg/subtle canvas — the paper beside the
// read-only cost panel (desktop), or stacked under a "Pinch to zoom" hint
// (mobile).
export const canvasStyles: SxProps<Theme> = {
  flex: 1,
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  justifyContent: { xs: 'flex-start', md: 'center' },
  alignItems: { xs: 'stretch', md: 'flex-start' },
  gap: { xs: `${space[16]}px`, md: `${space[32]}px` },
  p: { xs: `${space[16]}px`, md: `${space[40]}px` },
};

export const paperStyles: SxProps<Theme> = {
  boxShadow: shadowTokens.softLg,
  flexShrink: 0,
};

export const sideColumnStyles: SxProps<Theme> = {
  width: { xs: '100%', md: SIDE_COLUMN_WIDTH },
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
  position: { md: 'sticky' },
  // Clears the sticky toolbar plus the canvas padding.
  top: { md: TOOLBAR_DESKTOP_HEIGHT + space[40] },
};

export const pinchHintStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: `${space[8]}px`,
  px: `${space[16]}px`,
  py: `${space[8]}px`,
  borderRadius: `${radius.pill}px`,
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
};

export const stateStyles: SxProps<Theme> = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  p: `${space[24]}px`,
};

// ?print=1 (the server-side PDF render): the bare sheet on white.
export const printPageStyles: SxProps<Theme> = {
  bgcolor: PAPER_COLORS.white,
};
