import type { SxProps, Theme } from '@mui/material';
import type { SystemStyleObject } from '@mui/system';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const outlinedCard: SystemStyleObject<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
};

// Figma Skeleton/Stat Tile: the tile's footprint with three bars.
export const tileSkeletonStyles: SxProps<Theme> = {
  ...outlinedCard,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: `${space[12]}px`,
  height: { xs: 128, md: 160 },
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  borderRadius: `${radius.lg}px`,
};

// Figma Skeleton/Event Card for the mobile list.
export const cardSkeletonStyles: SxProps<Theme> = {
  ...outlinedCard,
  display: 'flex',
  alignItems: 'center',
  gap: `${space[12]}px`,
  p: `${space[16]}px`,
  borderRadius: `${radius.lg}px`,
};

export const cardSkeletonTextStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[8]}px`,
  flex: 1,
};

export const cardListSkeletonStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[12]}px`,
};

// Bar sizes traced from the Figma skeleton components.
export const tileLabelBarStyles: SxProps<Theme> = { width: 64 };
export const tileCountBarStyles: SxProps<Theme> = { width: 100, height: 32 };
export const tileCaptionBarStyles: SxProps<Theme> = { width: 78 };

export const dateBlockBarStyles: SxProps<Theme> = {
  flexShrink: 0,
  width: 56,
  height: 60,
};

export const cardDateBarStyles: SxProps<Theme> = { width: '40%' };
export const cardClientBarStyles: SxProps<Theme> = { width: '75%' };
