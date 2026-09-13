import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

export const rowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space16}px`,
  flexWrap: 'wrap',
};

// accent-tint (count tile emphasis), per this story's own Tokens line.
export const tileStyles: SxProps<Theme> = {
  bgcolor: colorTokens.accentTint,
  p: `${spaceTokens.space16}px`,
  minWidth: 140,
  flex: '1 1 140px',
};

// tabular-nums, per this story's own Tokens line.
export const tileValueStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};
