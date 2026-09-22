import { useNavigate } from 'react-router-dom';
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { z } from 'zod';
import { createEventRowActivation } from '../../components/ui/event-row-activation';
import { formatSetup } from '../../components/ui/format-setup';
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
// Exported — upcoming-events-card-list.tsx's mobile card view reuses this
// exact same formatting rather than duplicating it.
export const formatClientNames = (clientContacts: UpcomingEvent['clientContacts']): string => {
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

// "Double x3, Single x2 | Check-in 2026-06-14 - Check-out 2026-06-16" —
// STORY-051's own "rooms, check-in/out visible" folded into the one Rooms
// column rather than a second column gated on the exact same `accommodation
// !== undefined` check `showRoomsColumn` already is. Either half is omitted
// (not "—") when that half's own data isn't there yet — no rooms booked, or
// no check-in/out entered — with the whole cell falling back to "—" only
// when neither half has anything, same "permitted but empty" convention as
// meals/setup.
const formatRooms = (accommodation: UpcomingEvent['accommodation']): string => {
  if (!accommodation) {
    return '—';
  }
  const roomsPart =
    accommodation.roomLines.length > 0
      ? accommodation.roomLines.map((line) => `${line.roomType} x${line.noOfRooms}`).join(', ')
      : null;
  const datesPart =
    accommodation.checkIn && accommodation.checkOut
      ? `Check-in ${toDateInputValue(accommodation.checkIn)} - Check-out ${toDateInputValue(accommodation.checkOut)}`
      : null;
  const parts = [roomsPart, datesPart].filter((part): part is string => part !== null);

  return parts.length > 0 ? parts.join(' | ') : '—';
};

const UpcomingEventsTable = ({ events }: UpcomingEventsTableProps) => {
  const navigate = useNavigate();
  // STORY-049/050's own new columns — present only when the API actually
  // sent the corresponding key (aaradhya-api gates each server-side per
  // role). Derived from the data itself, not a role check read out of
  // AuthContext here, so this table stays the same role-agnostic component
  // STORY-048 established: it renders whatever columns the response shape
  // it was actually given supports. Each key is either present on every row
  // or none (a single response is for one caller's one role), so checking
  // the first row is enough.
  const showMealsColumn = events[0]?.meals !== undefined;
  const showSetupColumn = events[0]?.setup !== undefined;
  const showRoomsColumn = events[0]?.accommodation !== undefined;

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
            {showSetupColumn && (
              <TableCell>
                <Typography variant="labelS">Setup</Typography>
              </TableCell>
            )}
            {showRoomsColumn && (
              <TableCell>
                <Typography variant="labelS">Rooms</Typography>
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
              {showSetupColumn && (
                <TableCell>
                  <Typography variant="bodyM">{formatSetup(event.setup)}</Typography>
                </TableCell>
              )}
              {showRoomsColumn && (
                <TableCell>
                  <Typography variant="bodyM">{formatRooms(event.accommodation)}</Typography>
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
