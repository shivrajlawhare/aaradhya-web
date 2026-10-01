import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

export const groupStyles: SxProps<Theme> = {
  gap: `${space[12]}px`,
};

export const headingStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

export const listStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
  gap: { xs: `${space[12]}px`, md: `${space[24]}px` },
  alignItems: 'start',
};

export const emptyTextStyles: SxProps<Theme> = {
  color: 'text.secondary',
};
