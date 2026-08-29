import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

export const formStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space16}px`, // space-16
};

// Shared by every field row on this form (dates, times, table/chair counts)
// and the button row at the bottom — a plain wrapping flex row with
// space-12 gaps, nothing row-specific enough to warrant separate names.
export const rowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`, // space-12
  flexWrap: 'wrap',
};

// surface + line tokens, per this story's Tokens line — the Setup section
// reads as its own card, distinct from the main session fields above it.
export const setupCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: 1, // radius-sm, via theme.shape.borderRadius
  p: `${spaceTokens.space12}px`, // space-12
  gap: `${spaceTokens.space12}px`, // space-12
};

// accent-tint for the active toggle state, per this story's Tokens line.
export const toggleActiveStyles: SxProps<Theme> = {
  bgcolor: colorTokens.accentTint,
};
