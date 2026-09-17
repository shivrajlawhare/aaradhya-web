import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens } from '../../theme/tokens';

export const tableCardStyles: SxProps<Theme> = {
  flex: 1,
  width: '100%',
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  overflow: 'hidden',
};

// status-confirmed (Active) / text-faint (Inactive) — this story's own
// Tokens line, outlined rather than filled so the chip reads as a label,
// not a second competing color block next to the Edit icon/Switch.
export const activeChipStyles: SxProps<Theme> = {
  color: colorTokens.statusConfirmed,
  borderColor: colorTokens.statusConfirmed,
};

export const inactiveChipStyles: SxProps<Theme> = {
  color: colorTokens.textFaint,
  borderColor: colorTokens.textFaint,
};
