import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const cardStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space8}px`, // space-8
  py: `${spaceTokens.space8}px`, // space-8
};

// tabular-nums for cost fields, per this story's Tokens line — keeps
// digits aligned as pax/cost_per_plate/total_cost change.
export const totalCostStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};
