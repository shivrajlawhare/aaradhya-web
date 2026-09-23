import { Box, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { z } from 'zod';
import { createEventRowActivation } from '../../components/ui/event-row-activation';
import type { dashboardUpcomingEventResultSchema } from '../../contract';
import { toDateInputValue } from '../event-detail/date-input';
import {
  cardStyles,
  clientStyles,
  dateStyles,
  emptyStateCardStyles,
  listStyles,
} from './upcoming-events-card-list.styles';
import { formatClientNames } from './upcoming-events-table';

type UpcomingEvent = z.infer<typeof dashboardUpcomingEventResultSchema>;

interface UpcomingEventsCardListProps {
  events: UpcomingEvent[];
}

// Below `md`, DashboardPage renders this instead of UpcomingEventsTable —
// the full table's up-to-9 columns don't fit a phone screen even with the
// table's own horizontal scroll, so rather than make the operator scroll
// sideways through nearly-empty columns, this shows only the two fields
// that matter for a quick glance (Date, Client) and relies on the same
// tap-to-open behavior the table's own rows already have to reach
// everything else. Same "table vs. card list below md" split
// event-list-page.tsx already established for EventsTable/EventsCardList.
const UpcomingEventsCardList = ({ events }: UpcomingEventsCardListProps) => {
  const navigate = useNavigate();

  if (events.length === 0) {
    return (
      <Paper elevation={0} sx={emptyStateCardStyles}>
        <Typography variant="bodyM">No upcoming Events</Typography>
      </Paper>
    );
  }

  return (
    <Stack sx={listStyles}>
      {events.map((event) => (
        <Box
          key={event.id}
          tabIndex={0}
          role="link"
          aria-label={`Open Event ${event.eventId}`}
          {...createEventRowActivation(navigate, event.id)}
          sx={cardStyles}
        >
          <Typography variant="bodyM" sx={dateStyles}>
            {toDateInputValue(event.date)}
          </Typography>
          <Typography variant="bodyM" sx={clientStyles}>
            {formatClientNames(event.clientContacts)}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
};

export default UpcomingEventsCardList;
