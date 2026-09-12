import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const rowStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${spaceTokens.space8}px`,
};
