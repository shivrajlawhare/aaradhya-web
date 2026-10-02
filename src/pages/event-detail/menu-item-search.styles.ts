import type { SxProps, Theme } from '@mui/material';
import { colorTokens } from '../../theme/tokens';

// accent-tint for a selected menu-item chip, per this story's Tokens line.
export const chipStyles: SxProps<Theme> = {
  bgcolor: colorTokens.accentTint,
};
