import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

export const sectionStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space16}px`, // space-16
};

export const dateFieldsStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`, // space-12
};

// surface-2 token, per this story's Tokens line, for the footer totals band.
export const footerStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface2,
  display: 'flex',
  gap: `${spaceTokens.space24}px`, // space-24
  p: `${spaceTokens.space12}px`, // space-12
};

export const footerValueStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};

export const readOnlyRoomLineStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space8}px`, // space-8
};
