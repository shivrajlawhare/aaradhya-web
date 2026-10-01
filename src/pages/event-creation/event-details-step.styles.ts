import type { SxProps, Theme } from '@mui/material';
import type { SystemStyleObject } from '@mui/system';
import { focusTokens, motionTokens, paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke, iconSize } = scaleTokens;

export const wrapperStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[24]}px`, md: `${space[32]}px` },
};

export const loadingStyles: SxProps<Theme> = {
  alignItems: 'center',
  py: `${space[40]}px`,
};

// Figma 05 New Event / 2 Event Details: the entry card.
export const formCardStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
  scrollMarginTop: `${space[24]}px`,
};

// Row 1: Event Type · (Custom event type) · Venue · Venue Cost · Pax —
// stacked on mobile, with Venue Cost + Pax side by side.
export const primaryFieldsStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  flexWrap: 'wrap',
  alignItems: { xs: 'stretch', md: 'flex-end' },
  gap: { xs: `${space[12]}px`, md: `${space[16]}px` },
};

const SELECT_FIELD_WIDTH = 240;
const COST_FIELD_WIDTH = 180;
const PAX_FIELD_WIDTH = 120;

export const eventTypeFieldStyles: SxProps<Theme> = {
  width: { xs: '100%', md: SELECT_FIELD_WIDTH },
};

export const venueFieldStyles: SxProps<Theme> = {
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

// Row 2: a date column beside the two clock pickers (desktop); stacked on
// mobile.
const DATE_COLUMN_WIDTH = 240;

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

// The Setup sub-card nested inside the entry card — the subtle custard
// panel, one level in. Shared in spirit with session-form.styles.ts's own
// setupCardStyles: the same Setup card, reachable from two screens.
export const setupCardStyles: SxProps<Theme> = {
  bgcolor: paletteVar('brand-subtle'),
  borderRadius: `${radius.lg}px`,
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
};

const SEATING_FIELD_WIDTH = 280;
const COUNT_FIELD_WIDTH = 140;

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

// ── Added events ────────────────────────────────────────────────────────
export const addedSectionStyles: SxProps<Theme> = {
  gap: `${space[12]}px`,
};

export const addedHeaderStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  alignItems: { xs: 'flex-start', md: 'baseline' },
  gap: { xs: `${space[4]}px`, md: `${space[12]}px` },
};

export const summaryStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

// overflowX: 'auto' keeps every column reachable by horizontal scroll
// instead of clipping it (same fix as upcoming-events-table.styles.ts).
export const tableCardStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.md}px`,
  overflowX: 'auto',
  overflowY: 'hidden',
};

export const emptyCellStyles: SxProps<Theme> = {
  color: 'text.secondary',
  textAlign: 'center',
};

export const emptyTextStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

const EDITING_BAR_WIDTH = 2;

// Figma Table/Wizard Event Row: Hover = neutral hover; Editing = accent
// subtle fill with a 2 px focus bar on the leading edge.
export const addedRowStyles = (isEditing: boolean): SxProps<Theme> => ({
  cursor: 'pointer',
  bgcolor: isEditing ? paletteVar('brand-accentSubtle') : 'transparent',
  boxShadow: isEditing ? `inset ${EDITING_BAR_WIDTH}px 0 0 ${paletteVar('brand-focus')}` : 'none',
  '&.MuiTableRow-hover:hover': {
    bgcolor: isEditing ? paletteVar('brand-accentSubtle') : 'action.hover',
  },
  '&:focus-visible': { outline: 'none', boxShadow: focusTokens.ring },
});

export const cardListStyles: SxProps<Theme> = {
  gap: `${space[12]}px`,
};

const cardBase: SystemStyleObject<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[8]}px`,
  p: `${space[16]}px`,
  borderRadius: `${radius.lg}px`,
  cursor: 'pointer',
  transition: `background-color ${motionTokens.duration.fast}ms ${motionTokens.easing.fast}`,
  '&:focus-visible': { outline: 'none', boxShadow: focusTokens.ring },
};

// Figma Card/Wizard Session: Default / Editing (accent subtle + focus border).
export const addedCardStyles = (isEditing: boolean): SxProps<Theme> => ({
  ...cardBase,
  bgcolor: isEditing ? paletteVar('brand-accentSubtle') : 'background.paper',
  border: `${isEditing ? stroke.bold : stroke.default}px solid ${
    isEditing ? paletteVar('brand-focus') : paletteVar('divider')
  }`,
});

export const addedCardHeaderStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${space[8]}px`,
};

export const addedCardLineStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[8]}px`,
  color: 'text.secondary',
};

export const addedCardIconStyles: SxProps<Theme> = {
  fontSize: iconSize.s,
};
