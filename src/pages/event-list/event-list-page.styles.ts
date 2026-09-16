import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const pageStyles: SxProps<Theme> = {
  p: `${spaceTokens.space24}px`, // space-24
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`, // space-16
};

// Right-aligns the button on desktop (its own current placement, per this
// story's own AC) — full width on mobile is the Button's own `fullWidth`
// prop, not this.
export const actionsRowStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'flex-end',
};
