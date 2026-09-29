import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { z } from 'zod';
import EmptyState from '../../components/ui/empty-state';
import { createEventRowActivation } from '../../components/ui/event-row-activation';
import StatusChip from '../../components/ui/status-chip';
import { useEventManagerName } from '../../components/ui/use-event-manager-name';
import type { eventResultSchema } from '../../contract';
import {
  cardStyles,
  cardTextStyles,
  chevronStyles,
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
  const getManagerName = useEventManagerName();

  if (events.length === 0) {
    return (
      <Paper elevation={0} sx={emptyStateCardStyles}>
        <EmptyState illustration="no-events-yet" title="No Events yet" />
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
          <Box sx={cardTextStyles}>
            <Box sx={headerRowStyles}>
              <Typography variant="titleM" noWrap sx={familyTypeStyles} title={event.eventFamilyType}>
                {event.eventFamilyType}
              </Typography>
              <StatusChip status={event.status} />
            </Box>
            <Typography variant="labelM" sx={eventIdStyles}>
              {event.eventId}
            </Typography>
            <Typography variant="bodyM" sx={metaLineStyles}>
              {getBrideGroomNames(event.clientContacts)} · {getManagerName(event.eventManager)}
            </Typography>
          </Box>
          <ChevronRightRoundedIcon aria-hidden sx={chevronStyles} />
        </Paper>
      ))}
    </Stack>
  );
};

export default EventsCardList;
