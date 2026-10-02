import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const NUMBER_FIELD_WIDTH = 220;
// Lines the Add button up with the inputs, under their labels.
const LABEL_OFFSET = space[24];

// Figma "Add <Section>" card (UI-29): full width in the panel.
export const formStyles: SxProps<Theme> = {
  width: '100%',
  boxSizing: 'border-box',
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
};

export const fieldStackStyles: SxProps<Theme> = {
  gap: `${space[16]}px`,
};

// Desktop: Name fills · [Occupancy] · cost · Add in one row. Mobile: stacked.
export const fieldRowStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  alignItems: { xs: 'stretch', md: 'flex-start' },
  gap: `${space[12]}px`,
  '& > .MuiTextField-root:not(:first-of-type)': { width: { md: NUMBER_FIELD_WIDTH }, flexShrink: 0 },
};

export const addButtonStyles: SxProps<Theme> = {
  mt: { md: `${LABEL_OFFSET}px` },
  flexShrink: 0,
};
