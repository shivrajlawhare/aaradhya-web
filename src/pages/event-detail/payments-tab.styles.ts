import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

export const sectionStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space16}px`, // space-16
};

export const fieldsStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`, // space-12
  flexWrap: 'wrap',
};

// surface-2 token, per this story's Tokens line, for the balance card.
export const balanceCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface2,
  p: `${spaceTokens.space12}px`, // space-12
  // A very large amount must not overflow the card on a narrow viewport
  // (this story's own edge case) — wrap rather than force horizontal
  // scroll or clip.
  overflowWrap: 'break-word',
  maxWidth: '100%',
};

export const balanceValueStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};

// accent-deep, per this story's Tokens line — emphasis for a non-zero
// balance (outstanding due, or overpaid).
export const balanceEmphasisStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
  color: colorTokens.accentDeep,
};
