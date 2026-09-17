import type { SxProps, Theme } from '@mui/material';
import { colorTokens, spaceTokens } from '../../theme/tokens';

// Same "single horizontally-scrollable row" pattern as the calendar's own
// filter-chip-row.styles.ts (STORY-060) — reused here for the same reason:
// four section chips don't all fit a 390px screen without either wrapping
// (eating vertical space above the card list) or scrolling; this story's
// own AC calls for scrolling.
export const rowStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'nowrap',
  overflowX: 'auto',
  gap: `${spaceTokens.space8}px`,
  '& > *': {
    flexShrink: 0,
  },
};

export const chipStyles = (selected: boolean): SxProps<Theme> => ({
  bgcolor: selected ? colorTokens.accentTint : colorTokens.surface2,
  color: selected ? colorTokens.accent : colorTokens.text,
  fontWeight: selected ? 600 : 400,
  border: `1px solid ${selected ? colorTokens.accentTint : colorTokens.line}`,
});
