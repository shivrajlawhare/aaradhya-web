import type { SxProps, Theme } from '@mui/material';
import type { SystemStyleObject } from '@mui/system';
import { paletteVar, scaleTokens, shadowTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const DATES_WIDTH = 200;
const GUESTS_WIDTH = 120;
const SESSIONS_WIDTH = 110;
const GRAND_TOTAL_WIDTH = 184;

// Figma Summary Strip (73:5489). Desktop: one bordered row of tiles —
// Dates 200 · Venues (fills) · Guests 120 · Sessions 110 · Grand Total 184.
// Mobile: separate tiles — Dates · Guests + Sessions · Venues · Grand Total.
export const stripStyles = (hasGrandTotal: boolean): SxProps<Theme> => ({
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr 1fr',
    md: hasGrandTotal
      ? `${DATES_WIDTH}px minmax(0, 1fr) ${GUESTS_WIDTH}px ${SESSIONS_WIDTH}px ${GRAND_TOTAL_WIDTH}px`
      : `${DATES_WIDTH}px minmax(0, 1fr) ${GUESTS_WIDTH}px ${SESSIONS_WIDTH}px`,
  },
  gridTemplateAreas: {
    xs: hasGrandTotal
      ? '"dates dates" "guests sessions" "venues venues" "total total"'
      : '"dates dates" "guests sessions" "venues venues"',
    md: hasGrandTotal ? '"dates venues guests sessions total"' : '"dates venues guests sessions"',
  },
  gap: { xs: `${space[8]}px`, md: 0 },
  border: { md: `${stroke.default}px solid ${paletteVar('divider')}` },
  borderRadius: { md: `${radius.md}px` },
  overflow: { md: 'hidden' },
  m: 0,
});

const tileBase: SystemStyleObject<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[4]}px`,
  minWidth: 0,
  px: `${space[16]}px`,
  py: { xs: `${space[12]}px`, md: `${space[16]}px` },
  m: 0,
};

export const tileStyles = (area: string): SxProps<Theme> => ({
  ...tileBase,
  gridArea: area,
  bgcolor: 'background.paper',
  border: { xs: `${stroke.default}px solid ${paletteVar('divider')}`, md: 'none' },
  borderRadius: { xs: `${radius.md}px`, md: 0 },
  // Hairline dividers between desktop tiles.
  borderLeft: { md: area === 'dates' ? 'none' : `${stroke.hair}px solid ${paletteVar('divider')}` },
});

// The orange Grand Total tile (Event Manager only).
export const grandTotalTileStyles: SxProps<Theme> = {
  ...tileBase,
  gridArea: 'total',
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  border: { xs: `${stroke.default}px solid ${paletteVar('brand-borderStrong')}`, md: 'none' },
  borderRadius: { xs: `${radius.md}px`, md: 0 },
  boxShadow: { xs: shadowTokens.hardSm, md: 'none' },
};

export const labelStyles: SxProps<Theme> = {
  color: 'inherit',
  opacity: 0.8,
};

export const valueStyles: SxProps<Theme> = {
  m: 0,
  overflowWrap: 'anywhere',
};
