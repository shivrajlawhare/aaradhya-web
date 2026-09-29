import type { SxProps, Theme } from '@mui/material';
import { focusTokens, motionTokens, paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke, iconSize } = scaleTokens;

export const listStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[12]}px`,
};

// Figma Card/Event Kind=Upcoming: date block · date + clients · chevron.
export const cardStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[12]}px`,
  width: '100%',
  p: `${space[16]}px`,
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  cursor: 'pointer',
  transition: `background-color ${motionTokens.duration.fast}ms ${motionTokens.easing.fast}`,
  '&:hover': { bgcolor: paletteVar('brand-accentSubtle') },
  '&:focus-visible': { outline: 'none', boxShadow: focusTokens.ring },
};

const DATE_BLOCK_WIDTH = 56;
const DATE_BLOCK_HEIGHT = 60;

export const dateBlockStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: DATE_BLOCK_WIDTH,
  height: DATE_BLOCK_HEIGHT,
  borderRadius: `${radius.md}px`,
  bgcolor: paletteVar('brand-inverse'),
  color: paletteVar('brand-onInverse'),
};

export const textColumnStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[4]}px`,
  flex: 1,
  minWidth: 0,
};

export const dateStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

// A long client-name list must wrap (not overflow the card), same edge
// case events-card-list.styles.ts's own metaLineStyles already documents.
export const clientStyles: SxProps<Theme> = {
  overflowWrap: 'anywhere',
};

export const chevronStyles: SxProps<Theme> = {
  flexShrink: 0,
  fontSize: iconSize.m,
  color: 'text.secondary',
};

export const emptyStateCardStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.md}px`,
};
