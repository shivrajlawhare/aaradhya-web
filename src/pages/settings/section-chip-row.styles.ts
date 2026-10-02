import type { SxProps, Theme } from '@mui/material';
import { colorTokens, paletteVar, scaleTokens } from '../../theme/tokens';

const { space, stroke } = scaleTokens;

// One horizontally scrollable row (five sections don't fit 390 px), the
// same pattern as the calendar's filter chips.
export const rowStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'nowrap',
  overflowX: 'auto',
  gap: `${space[8]}px`,
  '& > *': {
    flexShrink: 0,
  },
};

// Figma: outlined pills; the selected one inverse (espresso fill).
export const chipStyles = (selected: boolean): SxProps<Theme> => ({
  bgcolor: selected ? paletteVar('brand-inverse') : 'background.paper',
  color: selected ? paletteVar('brand-onInverse') : colorTokens.text,
  fontWeight: 600,
  border: `${stroke.default}px solid ${selected ? paletteVar('brand-inverse') : paletteVar('divider')}`,
  '&:hover': {
    bgcolor: selected ? paletteVar('brand-inverse') : paletteVar('action-hover'),
  },
});
