import type { SxProps, Theme } from '@mui/material';
import { colorTokens, focusTokens, paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const NAV_WIDTH = 240;

export const navListStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[4]}px`,
  width: NAV_WIDTH,
  flexShrink: 0,
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  p: `${space[8]}px`,
};

// Figma Menu Item: Selected = accent tint, accent text, a trailing check.
export const sectionRowStyles = (selected: boolean): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${space[8]}px`,
  width: '100%',
  textAlign: 'left',
  border: 'none',
  font: 'inherit',
  cursor: 'pointer',
  px: `${space[12]}px`,
  py: `${space[12]}px`,
  borderRadius: `${radius.md}px`,
  bgcolor: selected ? colorTokens.accentTint : 'transparent',
  // on-tonal, not link: 9.73:1 on the tonal fill (link was 4.27 in light).
  color: selected ? paletteVar('brand-onTonal') : colorTokens.text,
  fontWeight: selected ? 600 : 400,
  '&:hover': {
    bgcolor: selected ? colorTokens.accentTint : paletteVar('action-hover'),
  },
  '&:focus-visible': { outline: 'none', boxShadow: focusTokens.ring },
});

export const checkIconStyles: SxProps<Theme> = {
  flexShrink: 0,
};
