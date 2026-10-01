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

// Matches accommodation-step.styles.ts's own summaryLineStyles — the
// derived '<check-in> to <check-out> · Total nights: N' line.
export const summaryLineStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
};

// Housekeeping/Reception see no money: the occupancy total and a "—".
export const occupancyOnlyStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space4}px`,
  fontVariantNumeric: 'tabular-nums',
};

export const readOnlyRoomLineStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space8}px`, // space-8
};
