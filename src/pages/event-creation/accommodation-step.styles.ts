import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const DATE_COLUMN_WIDTH = 320;
const DISCOUNT_FIELD_WIDTH = 140;
const NIGHTS_PANEL_MIN_WIDTH = 240;

export const wrapperStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[24]}px`, md: `${space[32]}px` },
};

export const loadingStyles: SxProps<Theme> = {
  alignItems: 'center',
  py: `${space[40]}px`,
};

// Figma 05 New Event / 3 Accommodation: the Check-in / Check-out card.
export const formCardStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
};

// Check-in · Check-out · the Total Nights panel (desktop); stacked on mobile.
export const dateRowStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  flexWrap: 'wrap',
  alignItems: { xs: 'stretch', md: 'flex-start' },
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
};

export const dateColumnStyles: SxProps<Theme> = {
  width: { xs: '100%', md: DATE_COLUMN_WIDTH },
  gap: `${space[12]}px`,
};

// The custard Total Nights panel. Desktop: label, big count, summary line;
// mobile: just the summary line in a compact box.
export const nightsPanelStyles: SxProps<Theme> = {
  flex: { md: 1 },
  minWidth: { md: NIGHTS_PANEL_MIN_WIDTH },
  bgcolor: paletteVar('brand-subtle'),
  borderRadius: `${radius.md}px`,
  p: { xs: `${space[12]}px ${space[16]}px`, md: `${space[20]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[8]}px`,
};

export const nightsLabelStyles: SxProps<Theme> = {
  display: { xs: 'none', md: 'block' },
  color: 'text.secondary',
};

export const nightsCountStyles: SxProps<Theme> = {
  display: { xs: 'none', md: 'block' },
  fontVariantNumeric: 'tabular-nums',
};

export const summaryLineStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

// Desktop: one card holds the Room Lines table and the totals footer.
export const roomsCardStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  p: `${space[24]}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[24]}px`,
};

// Mobile: "Rooms" heading, a card per line, then the totals.
export const roomsSectionStyles: SxProps<Theme> = {
  gap: `${space[12]}px`,
};

export const addButtonStyles: SxProps<Theme> = {
  borderRadius: `${radius.pill}px`,
};

export const discountFieldStyles: SxProps<Theme> = {
  width: { xs: '100%', md: DISCOUNT_FIELD_WIDTH },
};
