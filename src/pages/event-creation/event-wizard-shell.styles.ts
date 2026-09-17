import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const shellStyles: SxProps<Theme> = {
  p: 3, // space-24
  display: 'flex',
  flexDirection: 'column',
  gap: 3, // space-24
};

export const headerRowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${spaceTokens.space16}px`,
};

export const contentStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
};
