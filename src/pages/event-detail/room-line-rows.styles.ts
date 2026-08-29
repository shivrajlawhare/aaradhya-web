import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const tableCardStyles: SxProps<Theme> = {
  width: '100%',
};

// tabular-nums so digits in the numeric columns stay a fixed width — this
// story's own Tokens line calls for it on every numeric column.
export const numericCellStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};

export const addButtonStyles: SxProps<Theme> = {
  mt: `${spaceTokens.space12}px`, // space-12
};
