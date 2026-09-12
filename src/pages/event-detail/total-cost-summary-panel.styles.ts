import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

// surface-2, space-12, per this story's Tokens line.
export const panelStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface2,
  p: `${spaceTokens.space12}px`,
  gap: `${spaceTokens.space12}px`,
};

export const lineItemsStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space4}px`,
};

// tabular-nums throughout, per this story's Tokens line — every numeric
// line item lines up on its digits, not just the Grand Total.
export const lineItemValueStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};

export const extrasFieldsStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`,
  flexWrap: 'wrap',
};

// type-display (Fraunces) + accent-deep, per this story's Tokens line — the
// Grand Total is deliberately the single most visually prominent number on
// the panel (this story's own AC). A very large amount must wrap rather
// than overflow the card on a narrow viewport, same edge case
// payments-tab.styles.ts's balance card already guards against.
export const grandTotalValueStyles: SxProps<Theme> = {
  color: colorTokens.accentDeep,
  fontVariantNumeric: 'tabular-nums',
  overflowWrap: 'break-word',
  maxWidth: '100%',
};
