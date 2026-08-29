import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

export const sectionStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space16}px`, // space-16
};

export const listStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: 1, // radius-sm
};

export const rowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${spaceTokens.space12}px`, // space-12
  px: `${spaceTokens.space12}px`, // space-12
  py: `${spaceTokens.space12}px`, // space-12
};
