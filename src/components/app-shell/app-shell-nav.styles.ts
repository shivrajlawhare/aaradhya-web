import type { SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const navContentStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  gap: `${spaceTokens.space8}px`,
  p: `${spaceTokens.space16}px`,
};

export const wordmarkStyles: SxProps<Theme> = {
  color: colorTokens.drawerText,
  px: `${spaceTokens.space8}px`,
  py: `${spaceTokens.space16}px`,
};

export const navRowsStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space4}px`,
};

// Always at the bottom of the column, however many rows precede it — a
// role with only Dashboard/Events/Calendar/Logout doesn't pull Logout
// upward oddly, since `mt: auto` pins it against the Stack's own height
// (100%) rather than against its sibling rows.
export const logoutRowWrapperStyles: SxProps<Theme> = {
  mt: 'auto',
};

export const navRowStyles = (selected: boolean): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  gap: `${spaceTokens.space12}px`,
  px: `${spaceTokens.space12}px`,
  py: `${spaceTokens.space12}px`,
  borderRadius: `${radiusTokens.radiusSm}px`,
  bgcolor: selected ? alpha(colorTokens.accent, 0.18) : 'transparent',
  color: selected ? colorTokens.accent : colorTokens.drawerTextMuted,
  textDecoration: 'none',
  cursor: 'pointer',
  border: 'none',
  width: '100%',
  textAlign: 'left',
  font: 'inherit',
  '&:hover': {
    bgcolor: selected ? alpha(colorTokens.accent, 0.18) : alpha(colorTokens.drawerText, 0.06),
  },
});

export const navRowIconStyles: SxProps<Theme> = {
  display: 'flex',
  color: 'inherit',
  '& svg': { fontSize: 20 },
};

export const navRowLabelStyles = (selected: boolean): SxProps<Theme> => ({
  color: 'inherit',
  fontWeight: selected ? 600 : 400,
});
