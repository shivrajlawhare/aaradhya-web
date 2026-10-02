import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { iconSize, radius, space, stroke } = scaleTokens;

// Figma Card/Session in a 2-up grid (one column on mobile).
export const gridStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
  gap: { xs: `${space[12]}px`, md: `${space[24]}px` },
  alignItems: 'start',
  m: 0,
  p: 0,
  listStyle: 'none',
};

export const cardStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  p: `${space[16]}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[8]}px`,
};

export const cardHeaderStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${space[8]}px`,
};

export const detailLineStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[8]}px`,
  color: 'text.secondary',
};

export const detailIconStyles: SxProps<Theme> = {
  fontSize: iconSize.s,
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: { xs: 'stretch', md: 'flex-start' },
};
