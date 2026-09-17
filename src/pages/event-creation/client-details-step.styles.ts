import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const cardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  p: `${spaceTokens.space24}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`,
};

export const rowStackStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`,
};

export const rowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`,
  alignItems: 'flex-start',
};

export const roleLabelStyles: SxProps<Theme> = {
  color: colorTokens.text,
  width: 160,
  flexShrink: 0,
  // Lines up with the TextFields beside it (MUI's own input height at
  // default size), not floating above them the way an unstyled label would.
  pt: '16px',
};

export const roleFieldStyles: SxProps<Theme> = {
  width: 160,
  flexShrink: 0,
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
};
