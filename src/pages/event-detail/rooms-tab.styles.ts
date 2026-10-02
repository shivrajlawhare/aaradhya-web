import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

const DATE_FIELD_WIDTH = 240;

// Check-in · Check-out side by side; stacked on mobile.
export const dateFieldsStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  gap: { xs: `${space[12]}px`, md: `${space[16]}px` },
};

export const dateFieldStyles: SxProps<Theme> = {
  width: { xs: '100%', md: DATE_FIELD_WIDTH },
};

// The derived "<check-in> to <check-out> · Total nights: N" line.
export const summaryLineStyles: SxProps<Theme> = {
  color: 'text.secondary',
};

// Housekeeping/Reception see no money: the occupancy total and a "—".
export const occupancyOnlyStyles: SxProps<Theme> = {
  gap: `${space[4]}px`,
  fontVariantNumeric: 'tabular-nums',
};

export const readOnlyRoomLineStyles: SxProps<Theme> = {
  gap: `${space[8]}px`,
};
