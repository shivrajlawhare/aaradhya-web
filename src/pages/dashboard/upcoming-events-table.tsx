import { useNavigate } from 'react-router-dom';
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { z } from 'zod';
import { createEventRowActivation } from '../../components/ui/event-row-activation';
import StatusChip from '../../components/ui/status-chip';
import type { dashboardUpcomingEventResultSchema } from '../../contract';
import { toDateInputValue } from '../event-detail/date-input';
import { emptyStateStyles, numericCellStyles, rowStyles, tableCardStyles } from './upcoming-events-table.styles';

type UpcomingEvent = z.infer<typeof dashboardUpcomingEventResultSchema>;

interface UpcomingEventsTableProps {
  events: UpcomingEvent[];
}

// "—" when clientContacts is absent entirely (a role STORY-046 doesn't
// grant client visibility to, e.g. Housekeeping) — not an empty array, an
// undefined key, per that story's own "genuinely absent, not null"
// convention; this is the one column whose presence is role-dependent.
const formatClientNames = (clientContacts: UpcomingEvent['clientContacts']): string => {
  if (!clientContacts || clientContacts.length === 0) {
    return '—';
  }
  return clientContacts.map((contact) => contact.name).join(', ');
};

const UpcomingEventsTable = ({ events }: UpcomingEventsTableProps) => {
  const navigate = useNavigate();

  // Tiles still render with 0 above; this table's own empty state, per
  // this story's own edge case — not a blank table.
  if (events.length === 0) {
    return (
      <Paper sx={tableCardStyles}>
        <Box sx={emptyStateStyles}>
          <Typography variant="bodyM">No upcoming Events</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={tableCardStyles}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant="labelS">Date</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="labelS">Event</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="labelS">Client</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="labelS">Venue</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="labelS">Pax</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="labelS">Status</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events.map((event) => (
            <TableRow
              key={event.id}
              hover
              tabIndex={0}
              role="link"
              aria-label={`Open Event ${event.eventId}`}
              {...createEventRowActivation(navigate, event.id)}
              sx={rowStyles}
            >
              <TableCell sx={numericCellStyles}>
                <Typography variant="bodyM">{toDateInputValue(event.date)}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="bodyM">{event.eventFamilyType}</Typography>
                <Typography variant="labelS">{event.eventId}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="bodyM">{formatClientNames(event.clientContacts)}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="bodyM">{event.venue}</Typography>
              </TableCell>
              <TableCell sx={numericCellStyles}>
                <Typography variant="bodyM">{event.pax}</Typography>
              </TableCell>
              <TableCell>
                <StatusChip status={event.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default UpcomingEventsTable;
