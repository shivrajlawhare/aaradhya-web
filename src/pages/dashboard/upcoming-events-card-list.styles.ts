import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const listStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space8}px`,
};

export const cardStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${spaceTokens.space8}px`,
  width: '100%',
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  p: `${spaceTokens.space12}px`,
  cursor: 'pointer',
};

export const dateStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
  flexShrink: 0,
};

// A long client-name list must wrap (not overflow the card), same edge
// case events-card-list.styles.ts's own metaLineStyles already documents.
export const clientStyles: SxProps<Theme> = {
  overflowWrap: 'anywhere',
  textAlign: 'right',
};

export const emptyStateCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  p: `${spaceTokens.space24}px`,
};
