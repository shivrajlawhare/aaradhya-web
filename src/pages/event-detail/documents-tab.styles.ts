import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { iconSize, radius, space, stroke } = scaleTokens;

const PROGRESS_HEIGHT = 8;

export const progressBarStyles: SxProps<Theme> = {
  height: PROGRESS_HEIGHT,
  borderRadius: `${radius.pill}px`,
  bgcolor: paletteVar('brand-subtle'),
  '& .MuiLinearProgress-bar': { borderRadius: `${radius.pill}px`, bgcolor: 'primary.main' },
};

export const listStyles: SxProps<Theme> = {
  m: 0,
  p: 0,
  listStyle: 'none',
};

// Figma Checklist Row: status icon · label · switch, hairline-separated.
export const rowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[12]}px`,
  px: `${space[16]}px`,
  py: `${space[12]}px`,
  borderBottom: `${stroke.hair}px solid ${paletteVar('divider')}`,
};

export const labelStyles: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
};

export const receivedIconStyles: SxProps<Theme> = {
  fontSize: iconSize.m,
  color: 'success.main',
};

export const pendingIconStyles: SxProps<Theme> = {
  fontSize: iconSize.m,
  color: 'text.secondary',
};
