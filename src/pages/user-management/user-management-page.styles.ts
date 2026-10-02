import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

// Same page rhythm as the other redesigned screens (Figma Main: 24/40
// desktop, 16 mobile).
export const pageStyles: SxProps<Theme> = {
  px: { xs: `${space[16]}px`, md: `${space[40]}px` },
  py: { xs: `${space[16]}px`, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[24]}px`,
};

// Form card left, table right (the app's order, UI-28).
export const contentStyles: SxProps<Theme> = {
  gap: `${space[24]}px`,
  alignItems: 'flex-start',
};

export const mobileSectionStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
  width: '100%',
};
