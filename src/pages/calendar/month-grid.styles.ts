import type { SxProps, Theme } from '@mui/material';
import { colorTokens } from '../../theme/tokens';

export const gridStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
};

export const weekdayHeaderStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
  textAlign: 'center',
  py: 1,
};
