import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const sectionStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space24}px`, // space-24 — matches the wizard's own wrapperStyles between cards
};

// radiusMd (not radiusSm/`borderRadius: 1`) — matches every wizard step's
// own tableCardStyles/formCardStyles corner radius, per this pass's own
// card-language alignment.
export const listStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
};

export const rowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${spaceTokens.space12}px`, // space-12
  px: `${spaceTokens.space12}px`, // space-12
  py: `${spaceTokens.space12}px`, // space-12
};
