import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

// surface-2, space-12, per this story's Tokens line. `display: flex` +
// `flexDirection: column` is what actually makes `gap` do anything here —
// Paper's own root has no layout mode of its own (a plain block-level div),
// so a bare `gap` on it was previously a silent no-op: every direct child
// (the heading, the line-items Stack, the Grand Total row) rendered back
// to back with nothing but their own MUI default margins between them,
// which is what made the panel look like everything ran together with no
// spacing at all.
export const panelStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface2,
  display: 'flex',
  flexDirection: 'column',
  p: `${spaceTokens.space12}px`,
  gap: `${spaceTokens.space16}px`,
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

// Stacks the "Grand Total" label above its own value rather than leaving
// them as two adjacent inline elements with nothing between them — neither
// Typography's own "bodyM"/"display" variant has a `variantMapping` entry
// in theme.ts, so with no explicit `component` prop MUI renders both as a
// bare `<span>`, and two inline spans back to back have no natural gap of
// their own the way two block-level elements (or a Stack's own `gap`)
// would. This is what actually put the label and the amount "on the same
// line with no spacing" (this fix's own bug report).
// Rendered via a `Stack` (below), which already defaults to a flex column
// container on its own — no `display`/`flexDirection` needed here, unlike
// panelStyles above (a plain `Paper`, which has no layout mode of its own).
export const grandTotalRowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space4}px`,
  mt: `${spaceTokens.space8}px`,
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
