import type { SxProps, Theme } from '@mui/material';
import { colorTokens, paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space } = scaleTokens;

const PAX_FIELD_WIDTH = 160;

// Styled like the session forms' Setup panel (brand-subtle, radius lg).
export const cardStyles: SxProps<Theme> = {
  bgcolor: paletteVar('brand-subtle'),
  borderRadius: `${radius.lg}px`,
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
};

export const paxRowStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: { xs: `${space[12]}px`, md: `${space[16]}px` },
};

export const paxFieldStyles: SxProps<Theme> = {
  width: { xs: '100%', sm: PAX_FIELD_WIDTH },
};

// The non-blocking mismatch line: warning icon + body/s in feedback/warning/fg.
export const warningStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[8]}px`,
  color: paletteVar('feedback-warningFg'),
};

export const maintenanceChipStyles: SxProps<Theme> = {
  bgcolor: colorTokens.accentTint,
};
