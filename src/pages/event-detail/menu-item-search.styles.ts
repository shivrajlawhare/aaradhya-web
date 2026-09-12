import type { SxProps, Theme } from '@mui/material';
import { colorTokens } from '../../theme/tokens';

// accent-tint for a selected menu-item chip, per this story's Tokens line.
export const chipStyles: SxProps<Theme> = {
  bgcolor: colorTokens.accentTint,
};

// text-faint for the search placeholder, per this story's Tokens line —
// MUI's own placeholder styling doesn't default to this token, so it's set
// explicitly on the underlying input's ::placeholder pseudo-element.
export const searchFieldStyles: SxProps<Theme> = {
  '& .MuiInputBase-input::placeholder': {
    color: colorTokens.textFaint,
    opacity: 1,
  },
};
