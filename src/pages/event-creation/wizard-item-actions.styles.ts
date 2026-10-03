import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

// Figma Wizard/Item Actions, Position=Below list (UI-46): a plain row under
// the combined list — no longer sticky (R2).
export const toolbarStyles: SxProps<Theme> = {
  display: 'flex',
  gap: { xs: `${space[8]}px`, md: `${space[12]}px` },
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
