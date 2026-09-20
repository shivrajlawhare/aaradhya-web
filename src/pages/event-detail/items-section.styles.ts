import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

// Visual-only pass (no interaction change — ItemCard below stays an
// always-expanded form, not a collapsed clickable row like
// sessions-items-step.tsx's own row cards): this section reads as its own
// nested card within SessionForm's outer form card, the same surface2/
// radiusMd/space16 recipe session-form.styles.ts's own setupCardStyles
// already uses one section over — Setup and Items sit at the same nesting
// depth within the same outer form.
export const sectionStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface2,
  borderRadius: `${radiusTokens.radiusMd}px`,
  p: `${spaceTokens.space16}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space12}px`,
};
