import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

export const sectionStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space16}px`, // space-16
};

// surface + line tokens, per this story's Tokens line — the checklist reads
// as one bordered list, not a bare stack of rows.
export const listStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: 1,
};

export const rowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: `${spaceTokens.space8}px`, // space-8
  py: `${spaceTokens.space8}px`, // space-8
};
