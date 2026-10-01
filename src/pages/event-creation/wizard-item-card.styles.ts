import type { SxProps, Theme } from '@mui/material';
import { focusTokens, motionTokens, paletteVar, scaleTokens } from '../../theme/tokens';

const { iconSize, radius, space, stroke } = scaleTokens;

// Figma Card/Item: Default / Editing (accent subtle + focus border) — the
// same states as step 2's Card/Wizard Session.
export const cardStyles = (isEditing: boolean): SxProps<Theme> => ({
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[8]}px`,
  p: `${space[16]}px`,
  borderRadius: `${radius.lg}px`,
  cursor: 'pointer',
  transition: `background-color ${motionTokens.duration.fast}ms ${motionTokens.easing.fast}`,
  '&:focus-visible': { outline: 'none', boxShadow: focusTokens.ring },
  bgcolor: isEditing ? paletteVar('brand-accentSubtle') : 'background.paper',
  border: `${isEditing ? stroke.bold : stroke.default}px solid ${
    isEditing ? paletteVar('brand-focus') : paletteVar('divider')
  }`,
});

export const headerStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${space[8]}px`,
};

// A secondary detail line: icon + text (time, pax, cost).
export const detailLineStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: `${space[16]}px`,
  rowGap: `${space[4]}px`,
  color: 'text.secondary',
};

export const detailStyles: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: `${space[4]}px`,
};

export const detailIconStyles: SxProps<Theme> = {
  fontSize: iconSize.s,
};

export const chipListStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${space[8]}px`,
  m: 0,
  p: 0,
  listStyle: 'none',
};

export const chipStyles: SxProps<Theme> = {
  bgcolor: paletteVar('brand-tonal'),
  color: paletteVar('brand-onTonal'),
};
