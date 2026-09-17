import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

export const footerStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: `${spaceTokens.space12}px`,
  pt: `${spaceTokens.space16}px`,
  borderTop: `1px solid ${colorTokens.line}`,
};
