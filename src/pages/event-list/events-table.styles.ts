import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';
import { EventStatus } from '../../contract';

export const tableCardStyles: SxProps<Theme> = {
  width: '100%',
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  overflow: 'hidden',
};

export const rowStyles: SxProps<Theme> = {
  cursor: 'pointer',
};

interface StatusChipColors {
  backgroundColor: string;
  color: string;
}

// One entry per status token pair — a 1:1 color mapping, not a shared
// default with per-status overrides, so each status is independently
// verifiable (STORY-016 AC: "verified by asserting the rendered color ...
// per status value"). Applied via the Chip's `style` prop rather than `sx`
// specifically so that assertion is possible at all: an sx-generated
// emotion class isn't something jsdom's getComputedStyle reliably resolves
// in tests, whereas a genuine inline style is. Values still live centrally
// here, referencing the same color tokens as every other styles.ts file.
export const STATUS_CHIP_COLORS: Record<EventStatus, StatusChipColors> = {
  [EventStatus.Tentative]: {
    backgroundColor: colorTokens.statusTentativeTint,
    color: colorTokens.statusTentative,
  },
  [EventStatus.Confirmed]: {
    backgroundColor: colorTokens.statusConfirmedTint,
    color: colorTokens.statusConfirmed,
  },
  [EventStatus.Completed]: {
    backgroundColor: colorTokens.statusCompletedTint,
    color: colorTokens.statusCompleted,
  },
  [EventStatus.Cancelled]: {
    backgroundColor: colorTokens.statusCancelledTint,
    color: colorTokens.statusCancelled,
  },
};

// Caps a very long custom family-type value to one line with an ellipsis
// instead of stretching or wrapping the row.
export const familyTypeCellStyles: SxProps<Theme> = {
  maxWidth: 220,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const emptyStateStyles: SxProps<Theme> = {
  p: `${spaceTokens.space24}px`, // space-24
};
