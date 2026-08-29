import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const pageStyles: SxProps<Theme> = {
  p: `${spaceTokens.space24}px`, // space-24
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`, // space-16
};
