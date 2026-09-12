import { Stack, Typography } from '@mui/material';
import type { z } from 'zod';
import type { calendarSessionResultSchema } from '../../contract';
import { dayOfMonth, isInMonth } from './calendar-dates';
import { getEventsOnDate } from './calendar-events';
import { cellStyles, chipStackStyles, dayNumberStyles, outOfMonthDayNumberStyles } from './day-cell.styles';
import EventChip from './event-chip';

type CalendarSession = z.infer<typeof calendarSessionResultSchema>;

interface DayCellProps {
  date: string;
  month: number;
  year: number;
  sessions: CalendarSession[];
}

const DayCell = ({ date, month, year, sessions }: DayCellProps) => {
  const inMonth = isInMonth(date, month, year);
  const events = getEventsOnDate(sessions, date);

  return (
    <Stack sx={cellStyles}>
      <Typography variant="bodyM" sx={inMonth ? dayNumberStyles : outOfMonthDayNumberStyles}>
        {dayOfMonth(date)}
      </Typography>
      <Stack sx={chipStackStyles}>
        {events.map((event) => (
          <EventChip key={event.id} event={event} />
        ))}
      </Stack>
    </Stack>
  );
};

export default DayCell;
