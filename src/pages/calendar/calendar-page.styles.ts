import type { SxProps, Theme } from '@mui/material';
import { TOP_BAR_HEIGHT } from '../../components/app-shell/app-shell.styles';
import { colorTokens, spaceTokens } from '../../theme/tokens';

export const pageStyles: SxProps<Theme> = {
  p: { xs: `${spaceTokens.space16}px`, md: `${spaceTokens.space24}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${spaceTokens.space8}px`, md: `${spaceTokens.space16}px` },
  // Below `md` (STORY-059): fills the viewport under AppShell's own mobile
  // top bar, so the grid gets "as much height as the viewport allows"
  // while the chevrons/filter row above it stay reachable without
  // scrolling the page itself — only the grid scrolls internally if it
  // still overflows. Desktop keeps its natural (page-scrolls) height.
  height: { xs: `calc(100dvh - ${TOP_BAR_HEIGHT}px)`, md: 'auto' },
  overflow: { xs: 'hidden', md: 'visible' },
};

// space-between so the two chevrons reach the row's actual edges instead
// of bunching together next to the month label on the left.
export const monthNavStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
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
// Dark, matching the drawer — previously colorTokens.surface2 (light
// cream), the one strip on this screen that didn't match the shell's own
// dark-drawer branding.
export const mobileWeekdayHeaderStyles: SxProps<Theme> = {
  display: { xs: 'grid', md: 'none' },
  gridTemplateColumns: 'repeat(7, 1fr)',
  bgcolor: colorTokens.drawerBg,
};

export const mobileWeekdayHeaderCellStyles: SxProps<Theme> = {
  textAlign: 'center',
  py: `${spaceTokens.space8}px`,
  // Was textSoft (dark) — illegible against the now-dark strip above;
  // drawerTextMuted is the same muted-light tone the drawer nav's own
  // inactive rows already use.
  color: colorTokens.drawerTextMuted,
};
