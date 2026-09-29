import type { ReactNode } from 'react';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { tsr } from '../../api/client';
import PageHeader from '../../components/ui/page-header';
import { useAuth } from '../../stores/auth-context';
import CountTiles from './count-tiles';
import { formatEyebrowDate, formatGreeting } from './dashboard-dates';
import { pageStyles, sectionStyles, visuallyHiddenStyles } from './dashboard-page.styles';
import { CountTilesSkeleton, UpcomingCardsSkeleton, UpcomingTableSkeleton } from './dashboard-skeleton';
import UpcomingEventsCardList from './upcoming-events-card-list';
import UpcomingEventsTable from './upcoming-events-table';

const DASHBOARD_QUERY_KEY = ['dashboard'];

// One shared component for all four roles — GET /dashboard (STORY-047)
// already varies its own response by req.user.role (STORY-046's
// filterEventForRole), and this route carries no RequireRole (matching
// GET /events/GET /calendar's own precedent), so an F&B Head/Housekeeping/
// Reception session renders this exact same page, just with whatever
// fields the API actually returned for them (e.g. clientContacts absent
// for Housekeeping). STORY-049/050/051 reuse this component as-is.
const DashboardPage = () => {
  const theme = useTheme();
  // 900px — MUI's own `md` breakpoint, matching AppShell's/EventListPage's
  // own table-vs-card-list split.
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { user } = useAuth();
  const dashboardQuery = tsr.getDashboard.useQuery({ queryKey: DASHBOARD_QUERY_KEY });

  const now = new Date();
  const greeting = user ? formatGreeting(now, user.name) : undefined;

  let tiles: ReactNode;
  let upcoming: ReactNode;
  let loadingStatus: ReactNode = null;
  if (dashboardQuery.isPending) {
    loadingStatus = (
      <Box role="status" sx={visuallyHiddenStyles}>
        Loading dashboard
      </Box>
    );
    tiles = <CountTilesSkeleton />;
    upcoming = <UpcomingCardsSkeleton />;
    if (isDesktop) {
      upcoming = <UpcomingTableSkeleton />;
    }
  } else {
    const { counts, upcomingEvents } = dashboardQuery.data?.body ?? {
      counts: { todaysEvents: 0, upcoming: 0, tentative: 0, confirmed: 0 },
      upcomingEvents: [],
    };
    tiles = <CountTiles counts={counts} />;
    upcoming = <UpcomingEventsCardList events={upcomingEvents} />;
    if (isDesktop) {
      upcoming = <UpcomingEventsTable events={upcomingEvents} />;
    }
  }

  return (
    <Box sx={pageStyles} aria-busy={dashboardQuery.isPending}>
      <PageHeader eyebrow={formatEyebrowDate(now)} title="Dashboard" supportingText={greeting} isTitleHiddenOnMobile />
      {loadingStatus}
      {tiles}
      <Box component="section" sx={sectionStyles}>
        <Typography variant="h2">Upcoming Events</Typography>
        {upcoming}
      </Box>
    </Box>
  );
};

export default DashboardPage;
