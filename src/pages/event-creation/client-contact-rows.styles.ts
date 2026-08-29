import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const rowStackStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`, // space-12
};

export const rowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`, // space-12
  alignItems: 'center',
  borderBottom: '1px solid', // line token, via border color below
  borderColor: 'divider', // line token — wired in theme.ts
  pb: `${spaceTokens.space12}px`, // space-12
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
};
