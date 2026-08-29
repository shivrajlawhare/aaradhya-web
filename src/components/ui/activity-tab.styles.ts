import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const rowStyles: SxProps<Theme> = {
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: `${spaceTokens.space4}px`,
};

export const metaRowStyles: SxProps<Theme> = {
  display: 'flex',
  gap: `${spaceTokens.space8}px`,
};

export const timestampStyles: SxProps<Theme> = {
  color: 'text.disabled', // text-faint (timestamps) — wired in theme.ts
};

export const emptyStateStyles: SxProps<Theme> = {
  p: 3, // space-24
};
