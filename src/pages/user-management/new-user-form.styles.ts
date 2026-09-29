import type { SxProps, Theme } from '@mui/material';
import { radiusTokens } from '../../theme/tokens';

export const formStyles: SxProps<Theme> = {
  p: 6, // space-24
  width: '100%',
  maxWidth: 320,
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
};

export const fieldStackStyles: SxProps<Theme> = {
  gap: 4, // space-16
};
