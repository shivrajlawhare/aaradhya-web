import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../../theme/tokens';

const { space } = scaleTokens;

export const groupStyles: SxProps<Theme> = {
  gap: `${space[12]}px`,
};

export const headingStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

// One column of Card/Item in the date's add order (R2, V6).
export const listStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[12]}px`,
  m: 0,
  p: 0,
  listStyle: 'none',
};

export const emptyTextStyles: SxProps<Theme> = {
  color: 'text.secondary',
};
