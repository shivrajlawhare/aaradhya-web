import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

// Below `md` (this story's own AC): a single horizontally-scrollable row,
// not wrapped chips eating vertical space above the grid — desktop keeps
// wrapping since there's width to spare there.
export const rowStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: { xs: 'nowrap', md: 'wrap' },
  overflowX: { xs: 'auto', md: 'visible' },
  gap: `${spaceTokens.space8}px`,
  // Chips shouldn't compress to fit the scroll container — each keeps its
  // own natural width and the row simply scrolls past what doesn't fit.
  '& > *': {
    flexShrink: 0,
  },
};
