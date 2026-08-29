import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { z } from 'zod';
import StatusChip from '../../components/ui/status-chip';
import { ClientContactRole, type eventResultSchema } from '../../contract';
import { eventDetailPath } from '../../routes';
import { emptyStateStyles, familyTypeCellStyles, rowStyles, tableCardStyles } from './events-table.styles';

type PublicEvent = z.infer<typeof eventResultSchema>;

interface EventsTableProps {
  events: PublicEvent[];
}

// "Priya & Rohan", or just the one present name, or "—" if neither Bride
// nor Groom made it into client_contacts (e.g. a Corporate event with only
// POC rows).
const getBrideGroomNames = (clientContacts: PublicEvent['clientContacts']): string => {
  const bride = clientContacts.find((contact) => contact.role === ClientContactRole.Bride);
  const groom = clientContacts.find((contact) => contact.role === ClientContactRole.Groom);
  // flatMap over [contact ? [contact.name] : []] narrows to string[] without
  // a hand-rolled `is` type guard (docs/typescript-rules.md rule 1) — a
  // plain .filter(Boolean) would keep the array typed (string | undefined)[].
  const names = [bride, groom].flatMap((contact) => (contact ? [contact.name] : []));

  if (names.length === 0) {
    return '—';
  }
  return names.join(' & ');
};

const EventsTable = ({ events }: EventsTableProps) => {
  const navigate = useNavigate();

  const handleRowActivate = (event: PublicEvent) => {
    navigate(eventDetailPath(event.id));
  };

  const handleRowKeyDown = (event: PublicEvent, keyboardEvent: KeyboardEvent<HTMLTableRowElement>) => {
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
      keyboardEvent.preventDefault();
      handleRowActivate(event);
    }
  };

  if (events.length === 0) {
    return (
      <Paper sx={tableCardStyles}>
        <Box sx={emptyStateStyles}>
          <Typography variant="bodyM">No Events yet</Typography>
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
              <Typography variant="labelS">Event ID</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="labelS">Family type</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="labelS">Status</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="labelS">Manager</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="labelS">Bride / Groom</Typography>
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
              onClick={() => handleRowActivate(event)}
              onKeyDown={(keyboardEvent) => handleRowKeyDown(event, keyboardEvent)}
              sx={rowStyles}
            >
              <TableCell>
                <Typography variant="bodyM">{event.eventId}</Typography>
              </TableCell>
              <TableCell sx={familyTypeCellStyles} title={event.eventFamilyType}>
                <Typography variant="bodyM" noWrap>
                  {event.eventFamilyType}
                </Typography>
              </TableCell>
              <TableCell>
                <StatusChip status={event.status} />
              </TableCell>
              <TableCell>
                <Typography variant="bodyM">{event.eventManager}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="bodyM">{getBrideGroomNames(event.clientContacts)}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default EventsTable;
