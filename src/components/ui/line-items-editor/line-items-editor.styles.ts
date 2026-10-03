import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../../theme/tokens';

const { space, stroke } = scaleTokens;

export const editorStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[12]}px`,
  pt: `${space[16]}px`,
  borderTop: `${stroke.hair}px solid ${paletteVar('divider')}`,
};

export const headingStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

export const emptyTextStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

export const listStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  m: 0,
  p: 0,
  listStyle: 'none',
};

// name · note on the left, amount and the icon buttons on the right.
export const rowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[12]}px`,
  py: `${space[8]}px`,
  '& + &': {
    borderTop: `${stroke.hair}px solid ${paletteVar('divider')}`,
  },
};

export const rowTextStyles: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  overflowWrap: 'anywhere',
};

export const rowNoteStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

export const rowAmountStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

export const rowActionsStyles: SxProps<Theme> = {
  display: 'flex',
  gap: `${space[4]}px`,
};
