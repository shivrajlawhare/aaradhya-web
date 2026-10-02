import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space } = scaleTokens;

const PROGRESS_HEIGHT = 8;

// The five fields in one row (desktop), stacked on mobile.
export const fieldsStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: 'repeat(5, minmax(0, 1fr))' },
  gap: { xs: `${space[12]}px`, md: `${space[16]}px` },
};

// Figma Balance card (accent-subtle): the balance beside the advance
// progress; stacked on mobile.
export const balanceCardStyles: SxProps<Theme> = {
  bgcolor: paletteVar('brand-accentSubtle'),
  borderRadius: `${radius.md}px`,
  px: `${space[20]}px`,
  py: `${space[16]}px`,
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  alignItems: { xs: 'stretch', md: 'center' },
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
};

export const balanceFigureStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[4]}px`,
  minWidth: 0,
};

export const balanceLabelStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

// A very large amount wraps rather than overflowing the card.
export const balanceValueStyles: SxProps<Theme> = {
  color: paletteVar('brand-link'),
  fontVariantNumeric: 'tabular-nums',
  overflowWrap: 'break-word',
  maxWidth: '100%',
};

export const progressStyles: SxProps<Theme> = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[8]}px`,
  minWidth: 0,
};

export const progressCaptionStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: `${space[8]}px`,
};

export const progressFigureStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};

export const progressBarStyles: SxProps<Theme> = {
  height: PROGRESS_HEIGHT,
  borderRadius: `${radius.pill}px`,
  bgcolor: 'background.paper',
  '& .MuiLinearProgress-bar': { borderRadius: `${radius.pill}px`, bgcolor: 'primary.main' },
};
