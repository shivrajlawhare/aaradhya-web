import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const ROOM_TYPE_FIELD_WIDTH = 248;
const NUMERIC_FIELD_WIDTH = 120;
const REMOVE_CELL_WIDTH = 48;

// Figma 07 Event Detail / Accommodation: the room-lines card.
export const tableCardStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[8]}px`,
};

// Every column stays reachable by horizontal scroll on a narrow tablet.
export const tableScrollStyles: SxProps<Theme> = {
  overflowX: 'auto',
};

export const roomTypeFieldStyles: SxProps<Theme> = {
  minWidth: { md: ROOM_TYPE_FIELD_WIDTH },
};

export const numericFieldStyles: SxProps<Theme> = {
  width: { xs: '100%', md: NUMERIC_FIELD_WIDTH },
};

export const amountCellStyles: SxProps<Theme> = {
  whiteSpace: 'nowrap',
};

export const removeCellStyles: SxProps<Theme> = {
  width: REMOVE_CELL_WIDTH,
  px: `${space[4]}px`,
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
};

// Mobile: one stacked block per room line, hairline-separated.
export const mobileLineStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[12]}px`,
  pb: `${space[16]}px`,
  borderBottom: `${stroke.hair}px solid ${paletteVar('divider')}`,
};

export const mobileNumbersStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr 1fr',
  alignItems: 'end',
  gap: `${space[12]}px`,
};

export const mobileTotalStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${space[8]}px`,
};
