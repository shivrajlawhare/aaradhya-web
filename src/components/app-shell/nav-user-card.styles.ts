import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, controlSize } = scaleTokens;

export const userCardStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[12]}px`,
  p: `${space[12]}px`,
  borderRadius: `${radius.md}px`,
  bgcolor: paletteVar('nav-hover'),
};

export const avatarStyles: SxProps<Theme> = {
  width: controlSize.m,
  height: controlSize.m,
  bgcolor: paletteVar('primary-main'),
  color: paletteVar('primary-contrastText'),
};

export const userDetailsStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: `${space[4]}px`,
  minWidth: 0,
};

export const userNameStyles: SxProps<Theme> = {
  color: paletteVar('nav-text'),
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '100%',
};

// Chip/Role, Tone=On dark.
export const roleChipStyles: SxProps<Theme> = {
  height: 24,
  bgcolor: 'transparent',
  color: paletteVar('nav-text'),
  border: `1px solid color-mix(in srgb, ${paletteVar('nav-text')} 20%, transparent)`,
};
