import type { SxProps, Theme } from '@mui/material';
import { focusTokens, motionTokens, paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke, iconSize } = scaleTokens;

export const listStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[12]}px`,
};

// Figma Card/Event Kind=Events list: text column + chevron.
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

export const cardTextStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[4]}px`,
  flex: 1,
  minWidth: 0,
};

export const headerRowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${space[8]}px`,
};

// flex-basis/min-width defaults would otherwise stop this from shrinking
// below its own text's intrinsic width, defeating the `noWrap` ellipsis
// truncation and pushing StatusChip out of the row instead.
export const familyTypeStyles: SxProps<Theme> = {
  flex: '1 1 auto',
  minWidth: 0,
};

export const eventIdStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

// This story's own edge case: a long Bride/Groom name string must wrap
// (not overflow the card) rather than force the card — and so the
// viewport — wider than it should be.
export const metaLineStyles: SxProps<Theme> = {
  color: 'text.secondary',
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
