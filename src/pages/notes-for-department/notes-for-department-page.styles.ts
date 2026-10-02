import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

// Figma 12 Notes for Department: the pages stacked on the bg/subtle canvas
// (the page background), centred on desktop.
export const canvasStyles: SxProps<Theme> = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: { xs: 'stretch', md: 'center' },
  gap: `${space[16]}px`,
  p: { xs: `${space[16]}px`, md: `${space[40]}px` },
};
