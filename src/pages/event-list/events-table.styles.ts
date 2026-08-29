import type { SxProps, Theme } from '@mui/material';
import { spaceTokens, radiusTokens } from '../../theme/tokens';

export const tableCardStyles: SxProps<Theme> = {
  width: '100%',
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  overflow: 'hidden',
};

export const rowStyles: SxProps<Theme> = {
  cursor: 'pointer',
};

// Caps a very long custom family-type value to one line with an ellipsis
// instead of stretching or wrapping the row.
export const familyTypeCellStyles: SxProps<Theme> = {
  maxWidth: 220,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const emptyStateStyles: SxProps<Theme> = {
  p: `${spaceTokens.space24}px`, // space-24
};
