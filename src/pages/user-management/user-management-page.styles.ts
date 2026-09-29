import type { SxProps, Theme } from '@mui/material';

export const pageStyles: SxProps<Theme> = {
  p: 6, // space-24
  display: 'flex',
  flexDirection: 'column',
  gap: 6, // space-24
};

export const contentStyles: SxProps<Theme> = {
  gap: 6, // space-24
  alignItems: 'flex-start',
};

export const mobileSectionStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4, // space-16
  width: '100%',
};
