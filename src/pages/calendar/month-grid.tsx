import { Box, Typography } from '@mui/material';
import type { z } from 'zod';
import type { calendarSessionResultSchema } from '../../contract';
import { buildMonthGrid } from './calendar-dates';
import DayCell from './day-cell';
import { gridStyles, weekdayHeaderStyles } from './month-grid.styles';

type CalendarSession = z.infer<typeof calendarSessionResultSchema>;

interface MonthGridProps {
  month: number;
  year: number;
  sessions: CalendarSession[];
}

// Sunday-first, matching calendar-dates.ts's own buildMonthGrid.
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// As many rows as buildMonthGrid actually returns (4, 5, or 6) — never a
// fixed row count (this story's own edge case).
const MonthGrid = ({ month, year, sessions }: MonthGridProps) => {
  const weeks = buildMonthGrid(month, year);

  return (
    <Box>
      <Box sx={gridStyles}>
        {WEEKDAY_LABELS.map((label) => (
          <Typography key={label} variant="labelS" sx={weekdayHeaderStyles}>
            {label}
          </Typography>
        ))}
      </Box>
      {weeks.map((week) => (
        <Box key={week[0]} sx={gridStyles}>
          {week.map((date) => (
            <DayCell key={date} date={date} month={month} year={year} sessions={sessions} />
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default MonthGrid;
