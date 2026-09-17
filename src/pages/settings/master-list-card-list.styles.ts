import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const listStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space12}px`,
  width: '100%',
};

// A deactivated entry's whole card reads as muted, not just its status
// text — same convention users-card-list.styles.ts already established
// for a deactivated User Account.
export const cardStyles = (active: boolean): SxProps<Theme> => ({
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space4}px`,
  width: '100%',
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  p: `${spaceTokens.space16}px`,
  opacity: active ? 1 : 0.6,
});

export const headerRowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${spaceTokens.space8}px`,
};

export const actionsRowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${spaceTokens.space8}px`,
};

export const activeStatusStyles: SxProps<Theme> = {
  color: colorTokens.statusConfirmed,
};

export const inactiveStatusStyles: SxProps<Theme> = {
  color: colorTokens.textFaint,
};

export const costStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
};

export const emptyStateCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  p: `${spaceTokens.space16}px`,
  textAlign: 'center',
};
