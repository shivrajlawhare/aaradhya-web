import type { SxProps, Theme } from '@mui/material';
import { TOP_BAR_HEIGHT } from '../../components/app-shell/app-shell.styles';
import { colorTokens, spaceTokens } from '../../theme/tokens';

export const pageStyles: SxProps<Theme> = {
  p: `${spaceTokens.space24}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`,
  // Below `md` (STORY-059): fills the viewport under AppShell's own mobile
  // top bar, so the grid gets "as much height as the viewport allows"
  // while the chevrons/filter row above it stay reachable without
  // scrolling the page itself — only the grid scrolls internally if it
  // still overflows. Desktop keeps its natural (page-scrolls) height.
  height: { xs: `calc(100dvh - ${TOP_BAR_HEIGHT}px)`, md: 'auto' },
  overflow: { xs: 'hidden', md: 'visible' },
};

export const monthNavStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${spaceTokens.space8}px`,
};

// Full width, no max-width — the regression STORY-058 exists to fix
// ("too much margin" around the grid on desktop).
export const gridStyles: SxProps<Theme> = {
  width: '100%',
  flex: 1,
  minHeight: { xs: 0, md: 600 },
};

// The mobile-only single-letter weekday row (STORY-059) — replaces
// StandaloneMonthView's own header, hidden below `md` via theme.ts's
// MuiEventCalendar.monthViewHeader override, since the library always
// renders the three-letter form with no prop to shorten it. Seven equal
// columns spanning the same full width as the grid below it, so the
// letters land over their own actual day columns.
export const mobileWeekdayHeaderStyles: SxProps<Theme> = {
  display: { xs: 'grid', md: 'none' },
  gridTemplateColumns: 'repeat(7, 1fr)',
  bgcolor: colorTokens.surface2,
  borderBottom: `1px solid ${colorTokens.line}`,
};

export const mobileWeekdayHeaderCellStyles: SxProps<Theme> = {
  textAlign: 'center',
  py: `${spaceTokens.space8}px`,
  color: colorTokens.textSoft,
};
