import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const listStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space12}px`,
};

export const cardStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space4}px`,
  width: '100%',
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  p: `${spaceTokens.space16}px`,
  cursor: 'pointer',
};

export const headerRowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${spaceTokens.space8}px`,
};

// flex-basis/min-width defaults would otherwise stop this from shrinking
// below its own text's intrinsic width, defeating the `noWrap` ellipsis
// truncation and pushing StatusChip out of the row instead.
export const familyTypeStyles: SxProps<Theme> = {
  flex: '1 1 auto',
  minWidth: 0,
};

export const eventIdStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
};

// This story's own edge case: a long Bride/Groom name string must wrap
// (not overflow the card) rather than force the card — and so the
// viewport — wider than it should be.
export const metaLineStyles: SxProps<Theme> = {
  overflowWrap: 'anywhere',
};

export const emptyStateCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  p: `${spaceTokens.space24}px`,
};
