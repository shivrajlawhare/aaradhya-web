import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const EVENT_TYPE_FIELD_WIDTH = 320;
const AMOUNT_FIELD_WIDTH = 200;

export const wrapperStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
};

// Figma 05 New Event / 5 Review: the Event Type and Add Line Item cards.
export const cardStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
};

export const eventTypeRowStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  gap: `${space[12]}px`,
};

export const eventTypeFieldStyles: SxProps<Theme> = {
  width: { xs: '100%', md: EVENT_TYPE_FIELD_WIDTH },
};

// Name · Note (fills) · Total Cost on desktop; stacked on mobile.
export const lineItemFieldsStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: `1fr 2fr ${AMOUNT_FIELD_WIDTH}px` },
  gap: `${space[12]}px`,
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: { xs: 'stretch', md: 'flex-start' },
};

export const submittingNoteStyles: SxProps<Theme> = {
  color: 'text.secondary',
};
