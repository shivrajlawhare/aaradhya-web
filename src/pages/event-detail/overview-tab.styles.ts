import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const sectionStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space16}px`, // space-16
};

export const statusFieldStyles: SxProps<Theme> = {
  minWidth: 200,
};

export const contactsReadOnlyStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space8}px`, // space-8
};
