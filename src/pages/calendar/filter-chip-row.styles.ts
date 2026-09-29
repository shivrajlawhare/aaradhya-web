import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

// Below `md`: a single horizontally-scrollable row that runs to the screen
// edge (so the next chip peeks), not wrapped chips eating vertical space
// above the grid. Desktop keeps the chips right-aligned beside the month nav.
export const rowStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: { xs: 'nowrap', md: 'wrap' },
  justifyContent: { xs: 'flex-start', md: 'flex-end' },
  overflowX: { xs: 'auto', md: 'visible' },
  gap: `${space[8]}px`,
  mx: { xs: `-${space[16]}px`, md: 0 },
  px: { xs: `${space[16]}px`, md: 0 },
  scrollbarWidth: 'none',
  // Chips shouldn't compress to fit the scroll container — each keeps its
  // own natural width and the row simply scrolls past what doesn't fit.
  '& > *': {
    flexShrink: 0,
  },
};
