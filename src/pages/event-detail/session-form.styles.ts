import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const SELECT_FIELD_WIDTH = 240;
const COST_FIELD_WIDTH = 180;
const PAX_FIELD_WIDTH = 120;
const DATE_COLUMN_WIDTH = 240;
const SEATING_FIELD_WIDTH = 280;
const COUNT_FIELD_WIDTH = 140;

// Figma 07 Event Detail / Event Details — Add/Edit session: the wizard
// step-2 entry card, relabelled.
export const formStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
};

// Session type · Venue · Venue cost · Pax.
export const primaryFieldsStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  flexWrap: 'wrap',
  alignItems: { xs: 'stretch', md: 'flex-end' },
  gap: { xs: `${space[12]}px`, md: `${space[16]}px` },
};

export const selectFieldStyles: SxProps<Theme> = {
  width: { xs: '100%', md: SELECT_FIELD_WIDTH },
};

export const costPaxRowStyles: SxProps<Theme> = {
  display: 'flex',
  gap: { xs: `${space[12]}px`, md: `${space[16]}px` },
};

export const costFieldStyles: SxProps<Theme> = {
  flex: { xs: 1, md: 'none' },
  width: { md: COST_FIELD_WIDTH },
};

export const paxFieldStyles: SxProps<Theme> = {
  width: { xs: '40%', md: PAX_FIELD_WIDTH },
};

// The two dates (stacked) beside the two clocks; all stacked on mobile.
export const scheduleStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
};

export const dateColumnStyles: SxProps<Theme> = {
  width: { xs: '100%', md: DATE_COLUMN_WIDTH },
  gap: `${space[16]}px`,
};

export const timeFieldStyles: SxProps<Theme> = {
  gap: `${space[8]}px`,
  width: { xs: '100%', md: 'auto' },
};

// The Setup panel nested in the card (brand.subtle), as in the wizard.
export const setupCardStyles: SxProps<Theme> = {
  bgcolor: paletteVar('brand-subtle'),
  borderRadius: `${radius.lg}px`,
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
};

export const setupFieldsStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: { xs: `${space[12]}px`, md: `${space[16]}px` },
};

export const seatingFieldStyles: SxProps<Theme> = {
  width: { xs: '100%', md: SEATING_FIELD_WIDTH },
};

export const countFieldStyles: SxProps<Theme> = {
  flex: { xs: 1, md: 'none' },
  width: { md: COUNT_FIELD_WIDTH },
};

export const toggleRowStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${space[8]}px`,
};

// Figma Toggle (setup): outlined pills; on = tonal fill.
export const setupToggleStyles: SxProps<Theme> = {
  borderRadius: `${radius.pill}px`,
  px: `${space[16]}px`,
  py: `${space[4]}px`,
  textTransform: 'none',
  bgcolor: 'background.paper',
  '&.Mui-selected': {
    bgcolor: paletteVar('brand-tonal'),
    color: paletteVar('brand-onTonal'),
  },
};

export const formActionsStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  alignItems: { xs: 'stretch', md: 'center' },
  gap: `${space[12]}px`,
};
