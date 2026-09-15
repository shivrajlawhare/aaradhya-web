import { Box, CircularProgress } from '@mui/material';
import { tsr } from '../../api/client';
import CountTiles from './count-tiles';
import { pageStyles } from './dashboard-page.styles';
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
      <UpcomingEventsTable events={upcomingEvents} />
    </Box>
  );
};

export default DashboardPage;
