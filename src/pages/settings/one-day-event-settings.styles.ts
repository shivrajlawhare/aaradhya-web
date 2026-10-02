import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const ROOMS_INPUT_WIDTH = 72;
const REMOVE_BUTTON_COLUMN = 'auto';

// Figma 10 Settings — One Day Event (UI-41): the panel header, an intro
// line, then five form cards.
export const panelStyles: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
};

export const saveHeaderStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: `${space[16]}px`,
};

export const cardStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
};

export const loadingStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'center',
  py: `${space[40]}px`,
};

// Event type · Session type · Pax · GST, then Venue · Cost · Start · End.
export const eventFieldsStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
  gap: `${space[16]}px`,
};

export const roomsTableWrapperStyles: SxProps<Theme> = {
  overflowX: 'auto',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.md}px`,
};

export const roomsInputStyles: SxProps<Theme> = {
  width: ROOMS_INPUT_WIDTH,
};

// Name · Start · End · ×; stacked on mobile with × top-right.
export const ceremonyRowStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: `minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) ${REMOVE_BUTTON_COLUMN}` },
  alignItems: 'start',
  gap: `${space[12]}px`,
  position: 'relative',
};

// Each meal on the brand-subtle panel.
export const mealPanelStyles: SxProps<Theme> = {
  bgcolor: paletteVar('brand-subtle'),
  borderRadius: `${radius.md}px`,
  p: `${space[16]}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[12]}px`,
};

// Name · Start · End · Pax · Cost · ×.
export const mealFieldsStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    md: `minmax(0, 2fr) repeat(4, minmax(0, 1fr)) ${REMOVE_BUTTON_COLUMN}`,
  },
  alignItems: 'start',
  gap: `${space[12]}px`,
};

// Name · Note · Amount · ×.
export const lineItemRowStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: `minmax(0, 1fr) minmax(0, 1.5fr) minmax(0, 1fr) ${REMOVE_BUTTON_COLUMN}` },
  alignItems: 'start',
  gap: `${space[12]}px`,
};

// Lined up with the inputs (below their labels) on desktop; the row's end
// on mobile.
export const removeButtonStyles: SxProps<Theme> = {
  justifySelf: { xs: 'end', md: 'center' },
  mt: { xs: 0, md: `${space[24]}px` },
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
};
