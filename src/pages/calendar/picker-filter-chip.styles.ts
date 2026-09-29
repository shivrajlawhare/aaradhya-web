import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, iconSize } = scaleTokens;

const MENU_MIN_WIDTH = 168;

// Figma Chip/Filter Popover: a rounded list, selected row tonal with a check.
export const menuPaperStyles: SxProps<Theme> = {
  mt: `${space[8]}px`,
  minWidth: MENU_MIN_WIDTH,
};

export const menuItemStyles: SxProps<Theme> = {
  gap: `${space[12]}px`,
  justifyContent: 'space-between',
  '&.Mui-selected': {
    bgcolor: paletteVar('brand-tonal'),
    color: paletteVar('brand-onTonal'),
    fontWeight: 600,
  },
  '&.Mui-selected:hover': {
    bgcolor: paletteVar('brand-tonal'),
  },
};

export const menuCheckStyles: SxProps<Theme> = {
  fontSize: iconSize.m,
  borderRadius: `${radius.pill}px`,
};
