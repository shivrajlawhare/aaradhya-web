import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const pageStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${spaceTokens.space16}px`, md: `${spaceTokens.space24}px` },
  p: { xs: `${spaceTokens.space16}px`, md: `${spaceTokens.space24}px` },
};
