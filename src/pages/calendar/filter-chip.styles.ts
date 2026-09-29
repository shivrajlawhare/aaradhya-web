import type { SxProps, Theme } from '@mui/material';
import { focusTokens, motionTokens, paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke, iconSize } = scaleTokens;

const CHIP_HEIGHT = 36;

// Figma Chip/Filter: outlined pill with a chevron; Open = accent outline and
// the chevron flipped; Active (a value chosen) = inverse fill with a check.
export const chipStyles = (isActive: boolean, isOpen: boolean): SxProps<Theme> => ({
  height: CHIP_HEIGHT,
  px: `${space[4]}px`,
  borderRadius: `${radius.pill}px`,
  border: `${stroke.default}px solid ${isOpen ? paletteVar('primary-main') : paletteVar('brand-borderHover')}`,
  bgcolor: isActive ? paletteVar('brand-inverse') : 'background.paper',
  color: isActive ? paletteVar('brand-onInverse') : 'text.primary',
  transition: `border-color ${motionTokens.duration.fast}ms ${motionTokens.easing.fast}`,
  '&:hover': {
    bgcolor: isActive ? paletteVar('brand-inverse') : 'action.hover',
    borderColor: isOpen ? paletteVar('primary-main') : paletteVar('text-primary'),
  },
  '&.Mui-focusVisible': { boxShadow: focusTokens.ring },
  '& .MuiChip-icon': {
    ml: `${space[8]}px`,
    mr: `-${space[4]}px`,
    fontSize: iconSize.s,
    color: 'inherit',
  },
});

export const chipLabelStyles: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: `${space[4]}px`,
};

export const chevronStyles = (isOpen: boolean): SxProps<Theme> => ({
  fontSize: iconSize.m,
  transform: isOpen ? 'rotate(180deg)' : 'none',
  transition: `transform ${motionTokens.duration.fast}ms ${motionTokens.easing.fast}`,
});
