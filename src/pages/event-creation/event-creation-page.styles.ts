import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const pageStyles: SxProps<Theme> = {
  p: `${spaceTokens.space24}px`, // space-24
  display: 'flex',
  justifyContent: 'center',
};
