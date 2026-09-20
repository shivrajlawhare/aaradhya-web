import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const sectionStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space24}px`, // space-24 — matches accommodation-step.styles.ts's own wrapperStyles
};

// The Check-in/Check-out card — same recipe as accommodation-step.styles.ts's
// own formCardStyles, wrapping both editable DatePickers and the read-only
// summary line/list, so an EventManager's edit view and a Housekeeping/
// Reception's read-only view sit in the same card either way.
export const formCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  p: `${spaceTokens.space24}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`,
};

export const dateFieldsStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`, // space-12
};

// Matches accommodation-step.styles.ts's own summaryLineStyles exactly — the
// derived "<check-in> to <check-out> · Total days: N" line lives here, not in
// the footer band below (which is Occupancy/Charges only, mirroring the
// wizard's own split between this card and its footer).
export const summaryLineStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
};

export const footerStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space16}px`, // space-16
  flexWrap: 'wrap',
};

type FooterCellKind = 'occupancy' | 'charges';

// Identical recipe to accommodation-step.styles.ts's own footerCellStyles —
// same two stats (Total Occupancy, Total Charges), same color-coding, so the
// Rooms tab's footer reads as the same footer the wizard's Accommodation step
// already has, not a different design for the same data.
export const footerCellStyles = (kind: FooterCellKind): SxProps<Theme> => ({
  bgcolor: kind === 'occupancy' ? colorTokens.statusConfirmedTint : colorTokens.accentTint,
  color: kind === 'occupancy' ? colorTokens.statusConfirmed : colorTokens.accentDeep,
  border: `1px solid ${kind === 'occupancy' ? colorTokens.statusConfirmedTint : colorTokens.accentTint}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  px: `${spaceTokens.space16}px`,
  py: `${spaceTokens.space12}px`,
  fontVariantNumeric: 'tabular-nums',
  flex: 1,
});

export const readOnlyRoomLineStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space8}px`, // space-8
};
