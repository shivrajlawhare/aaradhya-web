import type { SxProps, Theme } from '@mui/material';
import type { SystemStyleObject } from '@mui/system';
import { eventCalendarClasses as calendarClasses } from '@mui/x-scheduler/event-calendar';
import { TOP_BAR_HEIGHT } from '../../components/app-shell/app-shell.styles';
import { paletteVar, scaleTokens } from '../../theme/tokens';
import { STATUS_RESOURCES } from './calendar-scheduler-events';

const { radius, space, stroke, controlSize } = scaleTokens;

export const pageStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[12]}px`, md: `${space[24]}px` },
  px: { xs: `${space[16]}px`, md: `${space[40]}px` },
  pt: { xs: `${space[16]}px`, md: `${space[32]}px` },
  pb: { xs: `${space[16]}px`, md: `${space[40]}px` },
  // Below `md` (STORY-059): fills the viewport under AppShell's own mobile
  // top bar, so the grid gets "as much height as the viewport allows"
  // while the chevrons/filter row above it stay reachable without
  // scrolling the page itself — only the grid scrolls internally if it
  // still overflows. Desktop keeps its natural (page-scrolls) height.
  height: { xs: `calc(100dvh - ${TOP_BAR_HEIGHT}px)`, md: 'auto' },
  overflow: { xs: 'hidden', md: 'visible' },
};

// The mobile top bar already says "Calendar"; Figma's mobile screen has no
// page header band.
export const pageHeaderFrameStyles: SxProps<Theme> = {
  display: { xs: 'none', md: 'block' },
};

// Month nav on the left, filter chips on the right (desktop); stacked on
// mobile, where the chips scroll sideways.
export const toolbarStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  alignItems: { xs: 'stretch', md: 'center' },
  justifyContent: 'space-between',
  gap: { xs: `${space[12]}px`, md: `${space[16]}px` },
};

export const monthNavStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: { xs: 'space-between', md: 'flex-start' },
  gap: `${space[12]}px`,
  flexShrink: 0,
};

// Figma: outlined circular chevron buttons around the month title.
export const monthNavButtonStyles: SxProps<Theme> = {
  width: controlSize.m,
  height: controlSize.m,
  border: `${stroke.default}px solid ${paletteVar('brand-borderStrong')}`,
};

// Figma banner: info tint, No Filter Results illustration, message.
export const noResultsBannerStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[16]}px`,
  px: { xs: `${space[16]}px`, md: `${space[24]}px` },
  py: `${space[12]}px`,
  borderRadius: `${radius.md}px`,
  bgcolor: paletteVar('feedback-infoBg'),
  color: paletteVar('feedback-infoFg'),
};

const BANNER_ART_WIDTH = 64;
const BANNER_ART_HEIGHT = 54;

export const noResultsArtStyles: SxProps<Theme> = {
  flexShrink: 0,
  width: BANNER_ART_WIDTH,
  height: BANNER_ART_HEIGHT,
};

export const loaderFrameStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'center',
  flex: 1,
  py: `${space[40]}px`,
};

// The grid card: header row + StandaloneMonthView inside one rounded,
// bordered container (Figma month grid).
export const gridFrameStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.md}px`,
  overflow: 'hidden',
};

// The mobile-only single-letter weekday row (STORY-059) — replaces
// StandaloneMonthView's own header, hidden below `md` via theme.ts's
// MuiEventCalendar.monthViewHeader override, since the library always
// renders the three-letter form with no prop to shorten it.
export const mobileWeekdayHeaderStyles: SxProps<Theme> = {
  display: { xs: 'grid', md: 'none' },
  gridTemplateColumns: 'repeat(7, 1fr)',
  bgcolor: paletteVar('brand-subtle'),
  borderBottom: `${stroke.hair}px solid ${paletteVar('divider')}`,
};

export const mobileWeekdayHeaderCellStyles: SxProps<Theme> = {
  textAlign: 'center',
  py: `${space[8]}px`,
  color: 'text.secondary',
};

const STATUS_TOKEN_KEYS: Record<string, string> = {
  Tentative: 'tentative',
  Confirmed: 'confirmed',
  Completed: 'completed',
  Cancelled: 'cancelled',
};

// Figma Calendar/Event Pill: the status tint with a 3 px bar in the status
// foreground. StandaloneMonthView tags each pill with its resource's
// `data-palette` (STATUS_RESOURCES), so each palette is re-pointed at the
// app's own status tokens here.
const statusPillColors: Record<string, Record<string, string>> = Object.fromEntries(
  STATUS_RESOURCES.map((resource) => {
    const key = STATUS_TOKEN_KEYS[String(resource.id)] ?? 'completed';
    return [
      `& .${calendarClasses.dayGridEvent}[data-palette="${resource.eventColor}"]`,
      {
        '--pill-bg': paletteVar(`status-${key}-bg`),
        '--pill-fg': paletteVar(`status-${key}-fg`),
      },
    ];
  })
);

const DESKTOP_GRID_MIN_HEIGHT = 640;
const PILL_HEIGHT = 20;
const PILL_BAR_WIDTH = 3;
const TODAY_SIZE = 24;

// Full width, no max-width — the regression STORY-058 exists to fix
// ("too much margin" around the grid on desktop).
export const gridStyles: SystemStyleObject<Theme> = {
  width: '100%',
  flex: 1,
  minHeight: { xs: 0, md: DESKTOP_GRID_MIN_HEIGHT },
  border: 'none',
  borderRadius: 0,
  [`& .${calendarClasses.monthViewHeader}`]: {
    bgcolor: paletteVar('brand-subtle'),
  },
  [`& .${calendarClasses.monthViewHeaderCell}`]: {
    typography: 'labelS',
    color: 'text.secondary',
    textAlign: 'left',
    px: `${space[12]}px`,
    py: `${space[8]}px`,
  },
  [`& .${calendarClasses.monthViewRow}:not(:last-of-type)`]: {
    borderBottom: `${stroke.hair}px solid ${paletteVar('divider')}`,
  },
  [`& .${calendarClasses.monthViewCell}`]: {
    p: { xs: `${space[4]}px`, md: `${space[8]}px` },
    bgcolor: 'background.paper',
  },
  [`& .${calendarClasses.monthViewCell}[data-weekend]`]: {
    bgcolor: paletteVar('brand-subtle'),
  },
  [`& .${calendarClasses.monthViewCell}[data-current]`]: {
    bgcolor: 'background.paper',
  },
  [`& .${calendarClasses.monthViewCell}[data-weekend][data-current]`]: {
    bgcolor: paletteVar('brand-subtle'),
  },
  // Day numbers sit top-left (Figma Calendar/Day Cell).
  [`& .${calendarClasses.monthViewCellNumber}, & .${calendarClasses.monthViewCellNumberButton}`]: {
    justifySelf: 'start',
    typography: 'labelM',
    color: 'text.primary',
  },
  [`& .${calendarClasses.monthViewCell}[data-other-month] .${calendarClasses.monthViewCellNumber}`]: {
    color: 'text.disabled',
  },
  // Today: an orange disc with the strong outline.
  [`& .${calendarClasses.monthViewCell}[data-current] > .${calendarClasses.monthViewCellNumberButton}`]: {
    display: 'grid',
    placeItems: 'center',
    width: TODAY_SIZE,
    height: TODAY_SIZE,
    borderRadius: '50%',
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
    border: `${stroke.default}px solid ${paletteVar('brand-borderStrong')}`,
    fontWeight: 700,
    mt: 0,
    [`& .${calendarClasses.monthViewCellNumber}`]: { p: 0, lineHeight: 1, alignSelf: 'center', justifySelf: 'center' },
  },
  ...statusPillColors,
  [`& .${calendarClasses.dayGridEvent}[data-palette]`]: {
    height: PILL_HEIGHT,
    borderRadius: `${radius.xs}px`,
    bgcolor: 'var(--pill-bg)',
    color: 'var(--pill-fg)',
    boxShadow: `inset ${PILL_BAR_WIDTH}px 0 0 var(--pill-fg)`,
    pl: `${space[8]}px`,
    gap: `${space[4]}px`,
    '&:hover': { bgcolor: 'var(--pill-bg)', filter: 'brightness(0.97)' },
  },
  // Truncation comes from the library's one-line clamp around time + title
  // (desktop) and theme.ts's own mobile title rule.
  [`& .${calendarClasses.dayGridEventTitle}`]: {
    typography: 'bodyS',
    color: 'var(--pill-fg)',
  },
  // The pill's tint and bar carry the status; no separate dot.
  [`& .${calendarClasses.eventColorIndicator}`]: {
    display: 'none',
  },
  [`& .${calendarClasses.dayGridEventTime}`]: {
    typography: 'labelS',
    textTransform: 'none',
    letterSpacing: 0,
    color: 'var(--pill-fg)',
  },
  [`& .${calendarClasses.monthViewMoreEvents}`]: {
    typography: 'labelS',
    textTransform: 'none',
    letterSpacing: 0,
    color: paletteVar('brand-link'),
  },
};
