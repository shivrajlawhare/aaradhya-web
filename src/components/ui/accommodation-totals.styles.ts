import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const MONEY_COLUMN_MIN_WIDTH = 300;

// Figma 05 New Event / 3 Accommodation footer. Desktop: the leading action
// (Add Room Line) · Discount (%) · Total Occupancy · the money column
// (breakdown over the Final Amount tile). Mobile: everything stacks, with
// Total Occupancy beside the tile on the last row. Without a discount the
// breakdown area is dropped from both templates (no empty grid row).
export const rootStyles = (hasDiscount: boolean): SxProps<Theme> => ({
  display: 'grid',
  gap: { xs: `${space[16]}px`, md: `${space[8]}px ${space[24]}px` },
  gridTemplateColumns: { xs: '1fr 1fr', md: `1fr auto auto minmax(${MONEY_COLUMN_MIN_WIDTH}px, auto)` },
  gridTemplateAreas: {
    xs: hasDiscount
      ? '"leading leading" "discount discount" "breakdown breakdown" "occupancy final"'
      : '"leading leading" "discount discount" "occupancy final"',
    md: hasDiscount
      ? '"leading discount occupancy breakdown" "leading discount occupancy final"'
      : '"leading discount occupancy final"',
  },
  alignItems: 'center',
});

export const leadingStyles: SxProps<Theme> = {
  gridArea: 'leading',
  display: 'flex',
  flexDirection: 'column',
  alignItems: { xs: 'stretch', md: 'flex-start' },
};

export const discountStyles: SxProps<Theme> = {
  gridArea: 'discount',
};

export const occupancyStyles: SxProps<Theme> = {
  gridArea: 'occupancy',
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[4]}px`,
};

export const statLabelStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

// The subtle custard panel: Total Charges / Discount N%.
export const breakdownStyles: SxProps<Theme> = {
  gridArea: 'breakdown',
  bgcolor: paletteVar('brand-subtle'),
  borderRadius: `${radius.md}px`,
  px: `${space[20]}px`,
  py: `${space[12]}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[4]}px`,
  m: 0,
};

export const breakdownRowStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: `${space[16]}px`,
};

export const breakdownValueStyles: SxProps<Theme> = {
  m: 0,
};

// The orange hero tile: Final Amount (or Total Charges with no discount).
export const finalTileStyles: SxProps<Theme> = {
  gridArea: 'final',
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  border: `${stroke.default}px solid ${paletteVar('brand-borderStrong')}`,
  borderRadius: `${radius.md}px`,
  px: `${space[20]}px`,
  py: `${space[12]}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[4]}px`,
};

export const finalValueStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};
