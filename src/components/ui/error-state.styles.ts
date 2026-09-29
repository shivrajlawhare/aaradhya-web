import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

// Figma `Error State`: illustration 240×200 on desktop, 192×160 on mobile.
export const errorStateStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: `${space[16]}px`,
  py: { xs: `${space[24]}px`, md: `${space[40]}px` },
  textAlign: 'center',
};

export const illustrationStyles: SxProps<Theme> = {
  width: { xs: 192, md: 240 },
  height: { xs: 160, md: 200 },
};

export const messageStyles: SxProps<Theme> = {
  color: 'text.primary',
};
