import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

// Figma Main: padding 32/40 and a 32 gap on desktop; 16 (40 at the bottom)
// and a 24 gap on mobile.
export const pageStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[24]}px`, md: `${space[32]}px` },
  px: { xs: `${space[16]}px`, md: `${space[40]}px` },
  pt: { xs: `${space[16]}px`, md: `${space[32]}px` },
  pb: `${space[40]}px`,
};

export const sectionStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
};
