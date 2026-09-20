import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

// The form's own outer card — same recipe as event-details-step.styles.ts's
// own formCardStyles (and every other wizard step's), so the Sessions tab's
// Add/Edit form reads as one of the same cards the wizard's own Session-entry
// form already is, not a bare unstyled Stack.
export const formStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  p: `${spaceTokens.space24}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`,
};

// Shared by every field row on this form (dates, times, table/chair counts)
// and the button row at the bottom — a plain wrapping flex row with
// space-12 gaps, nothing row-specific enough to warrant separate names.
export const rowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`, // space-12
  flexWrap: 'wrap',
};

// Identical recipe to event-details-step.styles.ts's own setupCardStyles —
// this is the exact same Setup card conceptually, just reachable from two
// different screens, so it renders pixel-identical in both.
export const setupCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface2,
  borderRadius: `${radiusTokens.radiusMd}px`,
  p: `${spaceTokens.space16}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space12}px`,
};

// accent-tint for the active toggle state, per this story's Tokens line.
export const toggleActiveStyles: SxProps<Theme> = {
  bgcolor: colorTokens.accentTint,
};

// Wraps one StaticTimePicker (STORY-057) — unlike TextField, it has no
// floating label of its own, so this pairs it with a plain heading above.
export const timeFieldStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space4}px`, // space-4
};
