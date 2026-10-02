import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { space, stroke } = scaleTokens;

const ROLE_FIELD_WIDTH = 180;

export const rowStackStyles: SxProps<Theme> = {
  gap: { xs: 0, md: `${space[12]}px` },
};

// Desktop: Name · Contact number (fill) · Role · ×. Mobile: stacked, with a
// hairline between contacts (Figma 07 Event Detail / Client Details).
export const rowStyles: SxProps<Theme> = {
  display: 'flex',
  gap: `${space[12]}px`,
  flexDirection: { xs: 'column', md: 'row' },
  alignItems: { xs: 'stretch', md: 'flex-end' },
  py: { xs: `${space[16]}px`, md: 0 },
  borderBottom: { xs: `${stroke.hair}px solid ${paletteVar('divider')}`, md: 'none' },
};

export const roleRowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: `${space[8]}px`,
};

export const roleFieldStyles: SxProps<Theme> = {
  width: { xs: '100%', md: ROLE_FIELD_WIDTH },
};

// The × lines up with the fields, not their labels.
export const removeButtonStyles: SxProps<Theme> = {
  mb: `${space[4]}px`,
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
  mt: { xs: `${space[8]}px`, md: 0 },
};
