import type { SxProps, Theme } from '@mui/material';
import { EventStatus } from '../../contract';
import { colorTokens, scaleTokens } from '../../theme/tokens';

const { radius, space } = scaleTokens;

interface StatusChipColors {
  backgroundColor: string;
  color: string;
}

// One entry per status token pair — a 1:1 color mapping, not a shared
// default with per-status overrides, so each status is independently
// verifiable (STORY-016 AC: "verified by asserting the rendered color ...
// per status value"). Applied via the Chip's `style` prop rather than `sx`:
// an sx-generated emotion class isn't something jsdom's getComputedStyle
// reliably resolves in tests, whereas a genuine inline style is. The values
// are palette.status CSS variables, so both colour schemes follow.
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

const CHIP_HEIGHT = 24;
const DOT_SIZE = 6;

// Figma `Chip/Status` (Size=S): 24 px pill, 6 px dot in the status
// foreground, label/m text, 4 px gap, 8 px side padding.
export const statusChipStyles: SxProps<Theme> = {
  height: CHIP_HEIGHT,
  gap: `${space[4]}px`,
  px: `${space[8]}px`,
  borderRadius: `${radius.pill}px`,
  '& .MuiChip-icon': {
    m: 0,
    color: 'inherit',
  },
  '& .MuiChip-label': {
    p: 0,
    typography: 'labelM',
  },
};

export const statusDotStyles: SxProps<Theme> = {
  width: DOT_SIZE,
  height: DOT_SIZE,
  borderRadius: '50%',
  bgcolor: 'currentColor',
  flexShrink: 0,
};
