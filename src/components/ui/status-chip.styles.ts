import { colorTokens } from '../../theme/tokens';
import { EventStatus } from '../../contract';

interface StatusChipColors {
  backgroundColor: string;
  color: string;
}

// One entry per status token pair — a 1:1 color mapping, not a shared
// default with per-status overrides, so each status is independently
// verifiable (STORY-016 AC: "verified by asserting the rendered color ...
// per status value"). Applied via the Chip's `style` prop rather than `sx`:
// an sx-generated emotion class isn't something jsdom's getComputedStyle
// reliably resolves in tests, whereas a genuine inline style is.
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
