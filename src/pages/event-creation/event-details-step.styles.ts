import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const wrapperStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space24}px`,
};

export const formCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  p: `${spaceTokens.space24}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`,
};

export const rowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`,
  flexWrap: 'wrap',
};

export const timeFieldStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space8}px`,
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
};

export const tableCardStyles: SxProps<Theme> = {
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  overflow: 'hidden',
};
