import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

export const cellStyles: SxProps<Theme> = {
  border: `1px solid ${colorTokens.line}`,
  bgcolor: colorTokens.surface,
  p: `${spaceTokens.space8}px`,
  gap: `${spaceTokens.space8}px`,
  minHeight: 96,
};

export const dayNumberStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
  color: colorTokens.textSoft,
};

// text-faint for a day outside the queried month, per this story's own
// Tokens line.
export const outOfMonthDayNumberStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
  color: colorTokens.textFaint,
};

export const chipStackStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space8}px`,
};
