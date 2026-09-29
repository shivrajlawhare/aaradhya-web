import type { SxProps, Theme } from '@mui/material';
import { motionTokens, paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, controlSize, space } = scaleTokens;

// Focus ring drawn against the nav's own dark surface (Nav/Sidebar Row,
// State=Focused): a nav-bg gap, then the focus colour.
export const navFocusRing = {
  outline: 'none',
  boxShadow: `0 0 0 2px ${paletteVar('nav-bg')}, 0 0 0 4px ${paletteVar('brand-focus')}`,
};

export const navContentStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[24]}px`,
  minHeight: '100%',
};

export const logoStyles: SxProps<Theme> = {
  display: 'block',
  width: 200,
  height: 'auto',
};

export const navRowsStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[4]}px`,
};

export const navFooterStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[12]}px`,
  mt: 'auto',
};

export const navRowStyles = (isSelected: boolean): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  gap: `${space[12]}px`,
  height: controlSize.l,
  px: `${space[16]}px`,
  borderRadius: `${radius.pill}px`,
  bgcolor: isSelected ? paletteVar('nav-activeBg') : 'transparent',
  color: isSelected ? paletteVar('nav-activeText') : paletteVar('nav-text'),
  textDecoration: 'none',
  cursor: 'pointer',
  border: 'none',
  width: '100%',
  textAlign: 'left',
  font: 'inherit',
  transition: `background-color ${motionTokens.duration.fast}ms ${motionTokens.easing.fast}`,
  '&:hover': {
    bgcolor: isSelected ? paletteVar('nav-activeBg') : paletteVar('nav-hover'),
  },
  '&:focus-visible': navFocusRing,
});

export const logoutRowStyles: SxProps<Theme> = {
  ...navRowStyles(false),
  color: paletteVar('nav-textMuted'),
};

export const navRowIconStyles: SxProps<Theme> = {
  display: 'flex',
  color: 'inherit',
  '& svg': { fontSize: 20 },
};

export const navRowLabelStyles: SxProps<Theme> = {
  color: 'inherit',
};
