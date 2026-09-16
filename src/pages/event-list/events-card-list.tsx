import { useNavigate } from 'react-router-dom';
import { Box, Paper, Stack, Typography } from '@mui/material';
import type { z } from 'zod';
import { createEventRowActivation } from '../../components/ui/event-row-activation';
import StatusChip from '../../components/ui/status-chip';
import type { eventResultSchema } from '../../contract';
import {
  cardStyles,
  emptyStateCardStyles,
  eventIdStyles,
  familyTypeStyles,
  headerRowStyles,
  listStyles,
  metaLineStyles,
} from './events-card-list.styles';
import { getBrideGroomNames } from './events-table';

type PublicEvent = z.infer<typeof eventResultSchema>;

interface EventsCardListProps {
  events: PublicEvent[];
}

// Below `md`, EventListPage renders this instead of EventsTable — the
// five-column table doesn't fit a 390px screen (STORY-055's own reported
// problem). Same data, same row-activation behavior, one card per Event
// instead of one table row.
const EventsCardList = ({ events }: EventsCardListProps) => {
  const navigate = useNavigate();

  if (events.length === 0) {
    return (
      <Paper elevation={0} sx={emptyStateCardStyles}>
        <Typography variant="bodyM">No Events yet</Typography>
      </Paper>
    );
  }

  return (
    <Stack sx={listStyles}>
      {events.map((event) => (
        <Paper
          key={event.id}
          elevation={0}
          tabIndex={0}
          role="link"
          aria-label={`Open Event ${event.eventId}`}
          {...createEventRowActivation(navigate, event.id)}
          sx={cardStyles}
        >
          <Box sx={headerRowStyles}>
            <Typography variant="titleM" noWrap sx={familyTypeStyles} title={event.eventFamilyType}>
              {event.eventFamilyType}
            </Typography>
            <StatusChip status={event.status} />
          </Box>
          <Typography variant="labelS" sx={eventIdStyles}>
            {event.eventId}
          </Typography>
          <Typography variant="bodyM" sx={metaLineStyles}>
            {getBrideGroomNames(event.clientContacts)} · {event.eventManager}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
};

export default EventsCardList;
