import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

// Figma 05 New Event / 1 Client Details: the contacts card beside a
// read-only "What's next" helper on desktop; the card alone on mobile.
export const layoutStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(0, 1fr)' },
  gap: `${space[24]}px`,
  alignItems: 'start',
};

export const cardStyles: SxProps<Theme> = {
  bgcolor: { xs: 'transparent', md: 'background.paper' },
  border: { xs: 'none', md: `${stroke.default}px solid ${paletteVar('divider')}` },
  borderRadius: `${radius.lg}px`,
  p: { xs: 0, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
};

export const rowStackStyles: SxProps<Theme> = {
  gap: { xs: `${space[12]}px`, md: `${space[16]}px` },
};

const ROLE_COLUMN_WIDTH = 160;
const NAME_COLUMN_MAX = 280;
const CONTACT_COLUMN_MAX = 220;
const REMOVE_COLUMN_WIDTH = 40;

// Desktop: role | Name | Contact Number | remove, aligned on the inputs.
// Mobile: one card per contact (Figma Row/Wizard Contact Layout=Mobile).
export const rowStyles: SxProps<Theme> = {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    md: `${ROLE_COLUMN_WIDTH}px minmax(0, ${NAME_COLUMN_MAX}px) minmax(0, ${CONTACT_COLUMN_MAX}px) ${REMOVE_COLUMN_WIDTH}px`,
  },
  alignItems: 'end',
  gap: { xs: `${space[12]}px`, md: `${space[16]}px` },
  p: { xs: `${space[16]}px`, md: 0 },
  bgcolor: { xs: 'background.paper', md: 'transparent' },
  border: { xs: `${stroke.default}px solid ${paletteVar('divider')}`, md: 'none' },
  borderRadius: `${radius.lg}px`,
};

// A default row's fixed role, sitting on the inputs' baseline on desktop and
// titling the card on mobile.
export const roleLabelStyles: SxProps<Theme> = {
  typography: { xs: 'titleS', md: 'labelL' },
  color: 'text.primary',
  pb: { xs: 0, md: `${space[12]}px` },
};

// Mobile only: the custom row's card header ("Additional contact").
export const customRowHeaderStyles: SxProps<Theme> = {
  display: { xs: 'block', md: 'none' },
  color: 'text.secondary',
  pr: `${space[40]}px`,
};

export const removeButtonStyles: SxProps<Theme> = {
  position: { xs: 'absolute', md: 'static' },
  top: space[12],
  right: space[12],
  mb: { xs: 0, md: `${space[4]}px` },
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: { xs: 'stretch', md: 'flex-start' },
};

// ── "What's next" helper (desktop only) ─────────────────────────────────
export const helperStyles: SxProps<Theme> = {
  display: { xs: 'none', md: 'flex' },
  flexDirection: 'column',
  gap: `${space[16]}px`,
  p: `${space[24]}px`,
  borderRadius: `${radius.lg}px`,
  bgcolor: paletteVar('brand-subtle'),
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
};

const HELPER_ART_WIDTH = 132;
const HELPER_ART_HEIGHT = 110;

export const helperArtStyles: SxProps<Theme> = {
  width: HELPER_ART_WIDTH,
  height: HELPER_ART_HEIGHT,
};

export const helperListStyles: SxProps<Theme> = {
  m: 0,
  p: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[12]}px`,
};

export const helperItemStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[12]}px`,
};
