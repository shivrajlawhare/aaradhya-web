import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const FIELD_COLUMN_WIDTH = 404;
const PAX_FIELD_WIDTH = 110;

export const wrapperStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
};

// The pill date tabs hug their content instead of stretching full width.
export const dateTabsStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
  maxWidth: '100%',
};

export const reminderListStyles: SxProps<Theme> = {
  gap: `${space[8]}px`,
};

// Figma 05 New Event / 4 Sessions & Items: the Ceremony / Food/Dining card —
// title over a fields column (left) and the two clocks (right); stacked on
// mobile.
export const sectionCardStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
};

export const sectionBodyStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: `minmax(0, ${FIELD_COLUMN_WIDTH}px) minmax(0, 1fr)` },
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
  alignItems: 'start',
};

export const fieldColumnStyles: SxProps<Theme> = {
  gap: `${space[16]}px`,
};

export const clockRowStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
  gap: `${space[16]}px`,
};

export const timeFieldStyles: SxProps<Theme> = {
  gap: `${space[8]}px`,
  minWidth: 0,
};

export const timeLabelStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

// Pax · L.S. · Cost per Plate.
export const paxRowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: `${space[12]}px`,
};

export const paxFieldStyles: SxProps<Theme> = {
  width: PAX_FIELD_WIDTH,
  flexShrink: 0,
};

export const costFieldStyles: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
};

// The L.S. label sits over its switch, level with the fields' labels.
export const lsToggleStyles: SxProps<Theme> = {
  alignItems: 'center',
  gap: `${space[8]}px`,
  pb: `${space[12]}px`,
};

export const lsLabelStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

export const previewLineStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

export const formActionsStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${space[12]}px`,
};
