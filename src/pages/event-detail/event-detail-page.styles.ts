import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const pageStyles: SxProps<Theme> = {
  p: `${spaceTokens.space24}px`, // space-24
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`, // space-16
};

export const headerStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${spaceTokens.space12}px`, // space-12
};

// Pushed to the row's far end via its own auto left-margin, rather than a
// wrapping spacer Box — the eventId/status/type cluster stays left-aligned
// exactly as before, only this one item's position changes.
export const deleteButtonStyles: SxProps<Theme> = {
  ml: 'auto',
};

export const tabPanelStyles: SxProps<Theme> = {
  pt: `${spaceTokens.space16}px`, // space-16
};
