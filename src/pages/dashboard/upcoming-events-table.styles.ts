import type { SxProps, Theme } from '@mui/material';
import { radiusTokens, spaceTokens } from '../../theme/tokens';

export const tableCardStyles: SxProps<Theme> = {
  width: '100%',
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  overflow: 'hidden',
};

export const rowStyles: SxProps<Theme> = {
  cursor: 'pointer',
};

export const emptyStateStyles: SxProps<Theme> = {
  p: `${spaceTokens.space24}px`, // space-24
};

// tabular-nums, per this story's own Tokens line — date and pax are the
// two numeric-ish columns worth digit alignment.
export const numericCellStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};
