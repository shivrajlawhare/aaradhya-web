import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens } from '../../theme/tokens';

// text/surface for an inactive chip, per this story's own Tokens line.
export const inactiveChipStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  color: colorTokens.text,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusLg}px`,
};

// Inverted — text fill / surface text — for the active chip, per this
// story's own Tokens line.
export const activeChipStyles: SxProps<Theme> = {
  bgcolor: colorTokens.text,
  color: colorTokens.surface,
  border: `1px solid ${colorTokens.text}`,
  borderRadius: `${radiusTokens.radiusLg}px`,
};
