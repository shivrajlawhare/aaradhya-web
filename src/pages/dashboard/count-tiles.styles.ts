import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

export const rowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space16}px`,
  flexWrap: 'wrap',
};

// accent-tint (count tile emphasis), per this story's own Tokens line.
// Explicit column flex — labelS/titleL are custom Typography variants with
// no entry in MUI's own variantMapping, so unlike h1..h6/body1/body2 they
// fall back to an inline <span> rather than a block element (STORY-054's
// own reported bug: label and value rendering beside each other instead of
// stacked). A flex column forces both into a column regardless of that
// inline default.
export const tileStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space4}px`,
  bgcolor: colorTokens.accentTint,
  p: `${spaceTokens.space16}px`,
  minWidth: 140,
  flex: '1 1 140px',
};

// tabular-nums, per this story's own Tokens line.
export const tileValueStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};
