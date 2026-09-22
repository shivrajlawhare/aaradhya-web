import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const pageStyles: SxProps<Theme> = {
  p: { xs: `${spaceTokens.space16}px`, md: `${spaceTokens.space24}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${spaceTokens.space12}px`, md: `${spaceTokens.space16}px` },
};

// flexWrap (previously a strict nowrap row) — the eventId/status/type/
// Delete-button cluster has no minWidth:0/shrink allowance on any of its
// children, so at narrow widths it would force the eventId text to break
// mid-word instead of the row just flowing onto a second line.
export const headerStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  rowGap: `${spaceTokens.space8}px`,
  gap: `${spaceTokens.space12}px`, // space-12
};

// Pushed to the row's far end via its own auto left-margin, rather than a
// wrapping spacer Box — the eventId/status/type cluster stays left-aligned
// exactly as before, only this one item's position changes.
export const deleteButtonStyles: SxProps<Theme> = {
  ml: 'auto',
};

export const tabPanelStyles: SxProps<Theme> = {
  pt: { xs: `${spaceTokens.space12}px`, md: `${spaceTokens.space16}px` },
};
