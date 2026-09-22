import { Box, CircularProgress, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { tsr } from '../../api/client';
import CountTiles from './count-tiles';
import { pageStyles } from './dashboard-page.styles';
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
  const dashboardQuery = tsr.getDashboard.useQuery({ queryKey: DASHBOARD_QUERY_KEY });

  if (dashboardQuery.isPending) {
    return (
      <Box sx={pageStyles}>
        <CircularProgress aria-label="Loading dashboard" />
      </Box>
    );
  }

  const { counts, upcomingEvents } = dashboardQuery.data?.body ?? {
    counts: { todaysEvents: 0, upcoming: 0, tentative: 0, confirmed: 0 },
    upcomingEvents: [],
  };

  return (
    <Box sx={pageStyles}>
      <CountTiles counts={counts} />
      {isDesktop ? <UpcomingEventsTable events={upcomingEvents} /> : <UpcomingEventsCardList events={upcomingEvents} />}
    </Box>
  );
};

export default DashboardPage;
