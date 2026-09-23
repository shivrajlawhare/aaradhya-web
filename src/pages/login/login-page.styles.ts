import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';


export const pageStyles: SxProps<Theme> = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: 'background.default', // bg token
  px: 2, // space-16
};

// 360 is a layout constraint for the card's max width — the token table has
// no size scale for container widths, so this isn't standing in for a token.
export const cardStyles: SxProps<Theme> = {
  width: '100%',
  maxWidth: 360,
  p: 3, // space-24
};

export const fieldStackStyles: SxProps<Theme> = {
  gap: 2, // space-16
};

export const wordmarkStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'center',
  px: `${spaceTokens.space8}px`,
  py: `${spaceTokens.space16}px`,
};

export const wordmarkImageStyles: SxProps<Theme> = {
  display: 'block',
  height: 64,
  width: 'auto',
};