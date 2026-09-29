import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

// Figma Table/Container: radius md, 1.5 px border, surface fill.
// `overflowX: 'auto'` keeps every column reachable by horizontal scroll on a
// narrow window while still clipping content to the rounded corners
// (STORY-054's own reported bug with `overflow: 'hidden'`).
export const tableCardStyles: SxProps<Theme> = {
  width: '100%',
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.md}px`,
  boxShadow: 'none',
  overflowX: 'auto',
  overflowY: 'hidden',
};

// Two-line cells (date, event) fit the 56 px row with 8 px vertical padding.
export const rowStyles: SxProps<Theme> = {
  cursor: 'pointer',
  '& .MuiTableCell-body': { py: `${space[8]}px` },
};

// tabular-nums, per this story's own Tokens line — date and pax are the
// two numeric-ish columns worth digit alignment.
export const numericCellStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};

export const dateDayStyles: SxProps<Theme> = {
  whiteSpace: 'nowrap',
};

export const dateMetaStyles: SxProps<Theme> = {
  color: paletteVar('brand-tertiary'),
  whiteSpace: 'nowrap',
};

export const eventIdStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

// Long client lists end in an ellipsis; the full list is in the title.
const CLIENT_COLUMN_MAX_WIDTH = 240;

export const clientTextStyles: SxProps<Theme> = {
  maxWidth: CLIENT_COLUMN_MAX_WIDTH,
};
