import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

// Matches accommodation-step.styles.ts's own tableCardStyles — a real
// bordered/rounded card, not just a bare full-width Table (this component's
// own Paper wrapper had no border/radius/overflow of its own before).
// overflowX: 'auto' (not 'hidden', which clipped whatever columns didn't
// fit instead of letting them be reached by horizontal scroll) — same fix
// upcoming-events-table.styles.ts's own tableCardStyles already applies,
// for the identical reason; this table had the same latent bug.
export const tableCardStyles: SxProps<Theme> = {
  width: '100%',
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  overflowX: 'auto',
  overflowY: 'hidden',
};

// tabular-nums so digits in the numeric columns stay a fixed width — this
// story's own Tokens line calls for it on every numeric column.
export const numericCellStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};

// None of these fields declared their own width before, so the Table's own
// auto-layout squeezed every column down to a near-unreadable sliver on a
// narrow screen (the horizontal-scroll fix above only helps once a column
// has a real width to scroll past). Matches accommodation-step.tsx's own
// Room type field (`sx={{ minWidth: 160 }}`) — the wizard's equivalent
// table never had this problem since that field alone already forces
// enough width for the whole row to need (and get) the same horizontal
// scroll.
export const roomTypeFieldStyles: SxProps<Theme> = {
  minWidth: 160,
};

export const numericFieldStyles: SxProps<Theme> = {
  minWidth: 100,
};

export const addButtonStyles: SxProps<Theme> = {
  mt: `${spaceTokens.space12}px`, // space-12
};
