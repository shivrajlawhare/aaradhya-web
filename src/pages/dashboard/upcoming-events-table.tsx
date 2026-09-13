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

// "Lunch (12:00-14:00)" per meal, joined — "—" only when F&B Head can see
// the column but this row's soonest session genuinely has no Meal Items
// yet (an empty array, still present, per aaradhya-api's own STORY-049
// Decisions distinguishing "permitted but empty" from "not permitted").
const formatMeals = (meals: NonNullable<UpcomingEvent['meals']>): string => {
  if (meals.length === 0) {
    return '—';
  }
  return meals
    .map((meal) => {
      const timing = meal.startTime && meal.endTime ? ` (${meal.startTime}-${meal.endTime})` : '';
      return `${meal.mealName ?? 'Meal'}${timing}`;
    })
    .join(', ');
};

const UpcomingEventsTable = ({ events }: UpcomingEventsTableProps) => {
  const navigate = useNavigate();
  // STORY-049's own new column — present only when the API actually sent
  // `meals` (F&B Head's own dashboard request; aaradhya-api gates this
  // server-side). Derived from the data itself, not a role check read out
  // of AuthContext here, so this table stays the same role-agnostic
  // component STORY-048 established: it renders whatever columns the
  // response shape it was actually given supports. `meals` is either
  // present on every row or none (a single response is for one caller's
  // one role), so checking the first row is enough.
  const showMealsColumn = events[0]?.meals !== undefined;

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
            {showMealsColumn && (
              <TableCell>
                <Typography variant="labelS">Meal / Timing</Typography>
              </TableCell>
            )}
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
              {showMealsColumn && (
                <TableCell>
                  <Typography variant="bodyM">{formatMeals(event.meals ?? [])}</Typography>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default UpcomingEventsTable;
