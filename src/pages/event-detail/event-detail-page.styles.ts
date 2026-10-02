import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

export const pageStyles: SxProps<Theme> = {
  p: { xs: `${space[16]}px`, md: `${space[24]}px ${space[40]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
};

// The theme's pill tabs, hugging their content (scrolling when they don't
// fit) rather than stretching across the page.
export const tabsStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
  maxWidth: '100%',
};

export const tabPanelStyles: SxProps<Theme> = {
  minWidth: 0,
};
