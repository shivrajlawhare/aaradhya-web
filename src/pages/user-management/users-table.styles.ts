import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, stroke } = scaleTokens;

// Figma Table/Users column widths (UI-43): Name fills, the rest fixed so the
// table still fits beside the form.
const USERNAME_COLUMN_WIDTH = 140;
const ROLE_COLUMN_WIDTH = 210;
const ROLE_SELECT_WIDTH = 180;
const ACTIVE_COLUMN_WIDTH = 160;
const ACTIONS_COLUMN_WIDTH = 72;

export const tableCardStyles: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  width: '100%',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  overflowX: 'auto',
};

export const usernameCellStyles: SxProps<Theme> = {
  width: USERNAME_COLUMN_WIDTH,
};

export const roleCellStyles: SxProps<Theme> = {
  width: ROLE_COLUMN_WIDTH,
};

export const roleSelectStyles: SxProps<Theme> = {
  width: ROLE_SELECT_WIDTH,
};

export const activeCellStyles: SxProps<Theme> = {
  width: ACTIVE_COLUMN_WIDTH,
  whiteSpace: 'nowrap',
};

export const actionsCellStyles: SxProps<Theme> = {
  width: ACTIONS_COLUMN_WIDTH,
  textAlign: 'center',
};
