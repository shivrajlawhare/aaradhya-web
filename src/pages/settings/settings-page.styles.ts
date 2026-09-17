import type { SxProps, Theme } from '@mui/material';

export const pageStyles: SxProps<Theme> = {
  p: 3, // space-24
  display: 'flex',
  flexDirection: 'column',
  gap: 3, // space-24
};

export const desktopContentStyles: SxProps<Theme> = {
  display: 'flex',
  gap: 3, // space-24
  alignItems: 'flex-start',
};

export const desktopPanelStyles: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2, // space-16
};

export const panelHeaderStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2, // space-16
};

export const mobileSectionStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2, // space-16
  width: '100%',
};
