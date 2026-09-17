import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const formStyles: SxProps<Theme> = {
  width: 280,
  flexShrink: 0,
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  p: `${spaceTokens.space16}px`,
};

export const fieldStackStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space16}px`,
};
