import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

// Matches accommodation-step.styles.ts's own tableCardStyles — a real
// bordered/rounded card, not just a bare full-width Table (this component's
// own Paper wrapper had no border/radius/overflow of its own before).
export const tableCardStyles: SxProps<Theme> = {
  width: '100%',
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  overflow: 'hidden',
};

// tabular-nums so digits in the numeric columns stay a fixed width — this
// story's own Tokens line calls for it on every numeric column.
export const numericCellStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};

export const addButtonStyles: SxProps<Theme> = {
  mt: `${spaceTokens.space12}px`, // space-12
};
