import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens } from '../../theme/tokens';

export const tableCardStyles: SxProps<Theme> = {
  flex: 1,
  width: '100%',
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  overflow: 'hidden',
};

// status-tentative/status-completed tints, repurposed per the story's Tokens
// line: active reads as "currently live" (tentative's warm amber), inactive
// as "done, no longer live" (completed's muted grey).
export const activeChipStyles: SxProps<Theme> = {
  bgcolor: colorTokens.statusTentativeTint,
  color: colorTokens.statusTentative,
};

export const inactiveChipStyles: SxProps<Theme> = {
  bgcolor: colorTokens.statusCompletedTint,
  color: colorTokens.statusCompleted,
};
