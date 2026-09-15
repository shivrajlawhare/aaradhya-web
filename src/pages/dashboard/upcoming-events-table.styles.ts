import type { SxProps, Theme } from '@mui/material';
import { radiusTokens, spaceTokens } from '../../theme/tokens';

// `overflow: 'hidden'` (its previous value) clipped whatever columns didn't
// fit the viewport instead of just rounding the card's corners — STORY-054's
// own reported bug. `overflowX: 'auto'` keeps every column reachable by
// horizontal scroll on mobile while still clipping content to the rounded
// corners exactly like `hidden` did; on desktop, where the table already
// fits, no scrollbar appears and nothing about the current layout changes.
export const tableCardStyles: SxProps<Theme> = {
  width: '100%',
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  overflowX: 'auto',
  overflowY: 'hidden',
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
