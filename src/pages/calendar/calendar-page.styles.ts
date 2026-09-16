import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const pageStyles: SxProps<Theme> = {
  p: `${spaceTokens.space24}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`,
};

export const monthNavStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${spaceTokens.space8}px`,
};

// Full width, no max-width — the regression this story exists to fix
// ("too much margin" around the grid on desktop).
export const gridStyles: SxProps<Theme> = {
  width: '100%',
  flex: 1,
  minHeight: 600,
};
