import { Box, CircularProgress, Typography } from '@mui/material';
import { tsr } from '../../api/client';
import EventsTable from './events-table';
import { pageStyles } from './event-list-page.styles';

const EVENTS_QUERY_KEY = ['events'];

const EventListPage = () => {
  const eventsQuery = tsr.listEvents.useQuery({ queryKey: EVENTS_QUERY_KEY });

  if (eventsQuery.isPending) {
    return (
      <Box sx={pageStyles}>
        <Typography variant="titleL" component="h1">
          Events
        </Typography>
        <CircularProgress aria-label="Loading events" />
      </Box>
    );
  }

  return (
    <Box sx={pageStyles}>
      <Typography variant="titleL" component="h1">
        Events
      </Typography>
      <EventsTable events={eventsQuery.data?.body ?? []} />
    </Box>
  );
};

export default EventListPage;
