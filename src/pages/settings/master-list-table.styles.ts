import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

// Figma Table/Master List widths (UI-29 / UI-40): Name fills.
const OCCUPANCY_COLUMN_WIDTH = 140;
const COST_COLUMN_WIDTH = 180;
const STATUS_COLUMN_WIDTH = 180;
const EDIT_COLUMN_WIDTH = 72;

export const panelBodyStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[24]}px`,
};

export const tableCardStyles: SxProps<Theme> = {
  width: '100%',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  overflowX: 'auto',
};

export const occupancyCellStyles: SxProps<Theme> = {
  width: OCCUPANCY_COLUMN_WIDTH,
  fontVariantNumeric: 'tabular-nums',
};

export const costCellStyles: SxProps<Theme> = {
  width: COST_COLUMN_WIDTH,
  fontVariantNumeric: 'tabular-nums',
};

export const statusCellStyles: SxProps<Theme> = {
  width: STATUS_COLUMN_WIDTH,
  whiteSpace: 'nowrap',
};

export const editCellStyles: SxProps<Theme> = {
  width: EDIT_COLUMN_WIDTH,
  textAlign: 'center',
};
