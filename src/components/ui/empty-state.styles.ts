import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

// Figma `Empty State`: Desktop art 320×240 (illustration 240×200),
// Mobile art 256×192 (illustration 192×160).
export const emptyStateStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: `${space[16]}px`,
  py: { xs: `${space[24]}px`, md: `${space[40]}px` },
  textAlign: 'center',
};

export const artStyles: SxProps<Theme> = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: { xs: 256, md: 320 },
  height: { xs: 192, md: 240 },
};

export const artBackdropStyles: SxProps<Theme> = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
};

export const illustrationStyles: SxProps<Theme> = {
  position: 'relative',
  width: { xs: 192, md: 240 },
  height: { xs: 160, md: 200 },
};

export const titleStyles: SxProps<Theme> = {
  color: 'text.primary',
};
