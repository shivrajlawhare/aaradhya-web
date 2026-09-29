import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

// Same page rhythm as the other redesigned screens (Figma Main: 32/40
// desktop, 16 mobile).
export const shellStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
  px: { xs: `${space[16]}px`, md: `${space[40]}px` },
  pt: { xs: `${space[16]}px`, md: `${space[32]}px` },
  pb: { xs: 0, md: `${space[40]}px` },
};

export const headerActionsStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[12]}px`,
};

export const contentStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
};
