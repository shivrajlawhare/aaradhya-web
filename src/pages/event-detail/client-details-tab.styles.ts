import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const sectionStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space24}px`, // space-24 — matches the wizard's own wrapperStyles between cards
};

// Status and Client Contacts each get their own card — same recipe as
// client-details-step.styles.ts's own cardStyles (and every other wizard
// step's formCardStyles) — so this tab reads as a sequence of cards the way
// every wizard step already does, not bare unstyled sections.
export const cardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  p: `${spaceTokens.space24}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`,
};

export const statusFieldStyles: SxProps<Theme> = {
  minWidth: 200,
};

export const contactsReadOnlyStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space8}px`, // space-8
};
