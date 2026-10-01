import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const ROOM_TYPE_FIELD_WIDTH = 260;
const NUMBER_FIELD_WIDTH = 160;
const REMOVE_CELL_WIDTH = 48;

// Desktop: the table sits inside the step's Rooms card; overflowX keeps
// every column reachable on a narrow tablet instead of clipping it.
export const tableScrollStyles: SxProps<Theme> = {
  overflowX: 'auto',
};

export const roomTypeFieldStyles: SxProps<Theme> = {
  minWidth: ROOM_TYPE_FIELD_WIDTH,
};

export const numberFieldStyles: SxProps<Theme> = {
  width: NUMBER_FIELD_WIDTH,
};

// Tariff reads right-aligned after its ₹ prefix, like the Figma field.
export const tariffFieldStyles: SxProps<Theme> = {
  '& input': { textAlign: 'right' },
};

export const amountCellStyles: SxProps<Theme> = {
  whiteSpace: 'nowrap',
};

export const removeCellStyles: SxProps<Theme> = {
  width: REMOVE_CELL_WIDTH,
  px: `${space[4]}px`,
};

// Mobile: Card/Room Line.
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
  gap: `${space[8]}px`,
};

export const cardTypeFieldStyles: SxProps<Theme> = {
  flex: 1,
};

export const secondaryTextStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

export const cardFieldRowStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: `${space[8]}px`,
};

export const cardAmountRowStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  pt: `${space[8]}px`,
  borderTop: `${stroke.hair}px solid ${paletteVar('divider')}`,
};
