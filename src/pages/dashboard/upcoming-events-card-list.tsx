import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { z } from 'zod';
import EmptyState from '../../components/ui/empty-state';
import { createEventRowActivation } from '../../components/ui/event-row-activation';
import type { dashboardUpcomingEventResultSchema } from '../../contract';
import { getDateBlockParts } from './dashboard-dates';
import {
  cardStyles,
  chevronStyles,
  clientStyles,
  dateBlockStyles,
  dateStyles,
  emptyStateCardStyles,
  listStyles,
  textColumnStyles,
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
        <EmptyState illustration="no-upcoming-events" title="No upcoming Events" />
      </Paper>
    );
  }

  return (
    <Stack sx={listStyles}>
      {events.map((event) => {
        const date = getDateBlockParts(event.date);
        return (
          <Box
            key={event.id}
            tabIndex={0}
            role="link"
            aria-label={`Open Event ${event.eventId}`}
            {...createEventRowActivation(navigate, event.id)}
            sx={cardStyles}
          >
            <Box sx={dateBlockStyles} aria-hidden>
              <Typography variant="h3" component="span">
                {date.day}
              </Typography>
              <Typography variant="labelS" component="span">
                {date.month}
              </Typography>
            </Box>
            <Box sx={textColumnStyles}>
              <Typography variant="labelM" sx={dateStyles}>
                {date.isoDate}
              </Typography>
              <Typography variant="bodyM" sx={clientStyles}>
                {formatClientNames(event.clientContacts)}
              </Typography>
            </Box>
            <ChevronRightRoundedIcon aria-hidden sx={chevronStyles} />
          </Box>
        );
      })}
    </Stack>
  );
};

export default UpcomingEventsCardList;
