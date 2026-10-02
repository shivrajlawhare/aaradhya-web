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
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
};

// Sub-nav card left, the selected section's panel right.
export const desktopContentStyles: SxProps<Theme> = {
  display: 'flex',
  gap: `${space[24]}px`,
  alignItems: 'flex-start',
};

export const desktopPanelStyles: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
};

// The section label and its "Add <Singular>" toggle.
export const panelHeaderStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${space[16]}px`,
};

export const mobileSectionStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
  width: '100%',
};
