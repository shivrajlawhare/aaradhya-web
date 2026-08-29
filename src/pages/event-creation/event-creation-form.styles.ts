import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const formStyles: SxProps<Theme> = {
  p: `${spaceTokens.space16}px`, // space-16
  width: '100%',
  maxWidth: 560,
};

export const fieldStackStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space16}px`, // space-16
};
