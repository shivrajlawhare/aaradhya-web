import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { controlSize, radius, space, stroke } = scaleTokens;

const AMOUNT_COLUMN_WIDTH = 168;
const GST_FIELD_WIDTH = 82;

export const summaryCardStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  overflow: 'hidden',
};

// The first column fills; the four amount columns are 168 wide.
export const tableStyles: SxProps<Theme> = {
  tableLayout: 'fixed',
  '& .MuiTableCell-root': { px: `${space[16]}px` },
};

export const headerCellStyles: SxProps<Theme> = {
  width: AMOUNT_COLUMN_WIDTH,
};

export const amountCellStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};

export const dateRowStyles: SxProps<Theme> = {
  bgcolor: paletteVar('brand-subtle'),
  px: { xs: `${space[16]}px`, md: 0 },
  py: { xs: `${space[12]}px`, md: 0 },
};

export const captionStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

export const inlineLabelStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: { xs: 'space-between', md: 'flex-start' },
  gap: `${space[12]}px`,
};

export const gstFieldStyles: SxProps<Theme> = {
  width: GST_FIELD_WIDTH,
  '& .MuiOutlinedInput-root': { minHeight: controlSize.m },
};

// Food Cost: accent-subtle fill, link-coloured label and amounts.
export const foodCostRowStyles: SxProps<Theme> = {
  bgcolor: paletteVar('brand-accentSubtle'),
  display: { xs: 'flex', md: 'table-row' },
  flexDirection: 'column',
  gap: `${space[8]}px`,
  p: { xs: `${space[16]}px`, md: 0 },
  borderBottom: { xs: `${stroke.hair}px solid ${paletteVar('divider')}`, md: 'none' },
};

export const foodCostLabelStyles: SxProps<Theme> = {
  color: paletteVar('brand-link'),
};

export const foodCostAmountStyles: SxProps<Theme> = {
  color: paletteVar('brand-link'),
  fontWeight: 600,
};

export const foodCostAmountCellStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
  color: paletteVar('brand-link'),
  fontWeight: 600,
};

export const manualAmountStyles: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: `${space[8]}px`,
};

// Grand Total: the orange accent row.
export const grandTotalRowStyles: SxProps<Theme> = {
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  display: { xs: 'flex', md: 'table-row' },
  alignItems: 'center',
  justifyContent: 'space-between',
  p: { xs: `${space[16]}px`, md: 0 },
  '& .MuiTableCell-root': { color: 'inherit', borderBottom: 'none', py: `${space[16]}px` },
};

export const grandTotalAmountStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};

// Mobile list.
export const listStyles: SxProps<Theme> = {
  m: 0,
  p: 0,
  listStyle: 'none',
};

export const listItemStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${space[12]}px`,
  px: `${space[16]}px`,
  py: `${space[12]}px`,
  borderBottom: `${stroke.hair}px solid ${paletteVar('divider')}`,
};
