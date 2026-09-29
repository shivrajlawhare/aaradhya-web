import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, stroke } = scaleTokens;

// Figma Table/Container: radius md, 1.5 px border, surface fill.
export const tableCardStyles: SxProps<Theme> = {
  width: '100%',
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.md}px`,
  boxShadow: 'none',
  overflow: 'hidden',
};

export const rowStyles: SxProps<Theme> = {
  cursor: 'pointer',
};

const FAMILY_TYPE_MAX_WIDTH = 220;

// Caps a very long custom family-type value to one line with an ellipsis
// instead of stretching or wrapping the row.
export const familyTypeCellStyles: SxProps<Theme> = {
  maxWidth: FAMILY_TYPE_MAX_WIDTH,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
