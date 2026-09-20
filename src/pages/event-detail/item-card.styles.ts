import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

// Visual-only pass — each Item reads as its own white/bordered card against
// ItemsSection's own surface2-tinted background (items-section.styles.ts's
// own sectionStyles), the same one-level-back-up contrast sessions-items-
// step.tsx's white outer form card has against its own page background.
// No interaction change: this is still an always-expanded form, not a
// collapsed clickable row.
export const cardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusSm}px`,
  p: `${spaceTokens.space12}px`,
  gap: `${spaceTokens.space8}px`, // space-8
};

// tabular-nums for cost fields, per this story's Tokens line — keeps
// digits aligned as pax/cost_per_plate/total_cost change.
export const totalCostStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};
