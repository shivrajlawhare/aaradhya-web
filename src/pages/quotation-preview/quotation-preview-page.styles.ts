import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

// surface, per this story's own Tokens line.
export const pageStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space24}px`,
  p: `${spaceTokens.space16}px`,
};

