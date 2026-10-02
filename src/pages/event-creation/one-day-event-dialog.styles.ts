import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

export const dialogContentStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
};

// Room above the field so its label isn't clipped under the title.
export const eventDateFieldStyles: SxProps<Theme> = {
  mt: `${space[8]}px`,
};
