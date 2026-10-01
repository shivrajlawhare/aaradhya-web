import type { SxProps, Theme } from '@mui/material';
import { TOP_BAR_HEIGHT } from '../../components/app-shell/app-shell.styles';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

// Figma Wizard/Item Actions: sticks to the top of the viewport while the
// rows below grow (desktop), or just under the fixed 64 px top bar (mobile).
// The canvas fill keeps scrolled content from showing through.
export const toolbarStyles: SxProps<Theme> = {
  position: 'sticky',
  top: { xs: TOP_BAR_HEIGHT, md: 0 },
  zIndex: 1,
  display: 'flex',
  gap: { xs: `${space[8]}px`, md: `${space[12]}px` },
  py: `${space[12]}px`,
  bgcolor: paletteVar('background-default'),
  // Size S on mobile with tighter sides, so both labels fit on one 358 px
  // row; desktop keeps size M's 20 px.
  '& .MuiButton-root': { whiteSpace: 'nowrap', px: { xs: `${space[12]}px`, md: `${space[20]}px` } },
};

const selectedStyles = {
  bgcolor: paletteVar('brand-inverse'),
  color: paletteVar('brand-onInverse'),
  '&:hover': { bgcolor: paletteVar('brand-inverse') },
};

// Button State=Selected is the Tonal button on the inverse fill, with no
// hover change. On mobile "Add Ceremony" hugs and "Add Food/Dining Event"
// fills the rest of the row.
export const actionButtonStyles = (isSelected: boolean, isFill: boolean): SxProps<Theme> => ({
  ...(isFill && { flex: { xs: 1, md: 'none' } }),
  ...(isSelected && selectedStyles),
});
