import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

// surface, per this story's own Tokens line.
export const pageStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space24}px`,
  p: `${spaceTokens.space16}px`,
};

export const sectionStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space8}px`,
};

// tabular-nums, per this story's own Tokens line — every numeric line
// (pax, venue cost, room totals) lines up on its digits.
export const numericLineStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};
