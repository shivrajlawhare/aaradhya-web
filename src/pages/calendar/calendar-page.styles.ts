import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const pageStyles: SxProps<Theme> = {
  p: `${spaceTokens.space24}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`,
};

export const monthNavStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${spaceTokens.space8}px`,
};
