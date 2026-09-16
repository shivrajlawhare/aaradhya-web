import AddIcon from '@mui/icons-material/Add';
import { Box, Button, CircularProgress, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { tsr } from '../../api/client';
import { Role } from '../../contract';
import { EVENT_CREATE_PATH } from '../../routes';
import { useAuth } from '../../stores/auth-context';
import EventsCardList from './events-card-list';
import EventsTable from './events-table';
import { actionsRowStyles, pageStyles } from './event-list-page.styles';

const EVENTS_QUERY_KEY = ['events'];

const EventListPage = () => {
  const eventsQuery = tsr.listEvents.useQuery({ queryKey: EVENTS_QUERY_KEY });
  const { user } = useAuth();
  const theme = useTheme();
  // 900px — MUI's own `md` breakpoint, matching AppShell's (STORY-053).
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  if (eventsQuery.isPending) {
    return (
      <Box sx={pageStyles}>
        <CircularProgress aria-label="Loading events" />
      </Box>
    );
  }

  const events = eventsQuery.data?.body ?? [];

  return (
    <Box sx={pageStyles}>
      {user?.role === Role.EventManager && (
        <Box sx={actionsRowStyles}>
          <Button
            component={RouterLink}
            to={EVENT_CREATE_PATH}
            variant="contained"
            startIcon={<AddIcon />}
            fullWidth={!isDesktop}
          >
            New Event
          </Button>
        </Box>
      )}
      {isDesktop ? <EventsTable events={events} /> : <EventsCardList events={events} />}
    </Box>
  );
};

export default EventListPage;
