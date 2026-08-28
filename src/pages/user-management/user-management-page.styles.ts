import type { SxProps, Theme } from '@mui/material';

export const pageStyles: SxProps<Theme> = {
  p: 3, // space-24
  display: 'flex',
  flexDirection: 'column',
  gap: 3, // space-24
};

export const contentStyles: SxProps<Theme> = {
  gap: 3, // space-24
  alignItems: 'flex-start',
};
