import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const wrapperStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space24}px`,
};

export const formCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  p: `${spaceTokens.space24}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`,
};

export const rowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`,
  flexWrap: 'wrap',
};

export const timeFieldStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space8}px`,
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
};

export const tableCardStyles: SxProps<Theme> = {
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  overflow: 'hidden',
};

// The Setup sub-card nested inside formCardStyles above — surface2 (not
// surface) and a tighter space16 padding read as "one level in," while
// keeping the same radiusMd as the outer card rather than a smaller radius,
// matching sessions-items-step.styles.ts's own sectionCardStyles/rowCardStyles
// precedent for a card nested inside a card. Shared verbatim (same values)
// with session-form.styles.ts's own setupCardStyles — this is the exact same
// Setup card conceptually, just reachable from two different screens.
export const setupCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface2,
  borderRadius: `${radiusTokens.radiusMd}px`,
  p: `${spaceTokens.space16}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space12}px`,
};

export const toggleActiveStyles: SxProps<Theme> = {
  bgcolor: colorTokens.accentTint,
};
