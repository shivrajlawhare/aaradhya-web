import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

const STATUS_FIELD_WIDTH = 280;

export const statusFieldStyles: SxProps<Theme> = {
  width: { xs: '100%', md: STATUS_FIELD_WIDTH },
};

export const contactsReadOnlyStyles: SxProps<Theme> = {
  gap: `${space[8]}px`,
};
