import { useState } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import { tsr } from '../../api/client';
import { formatMonthLabel, shiftMonth, type MonthShift } from './calendar-dates';
import { monthNavStyles, pageStyles } from './calendar-page.styles';
import MonthGrid from './month-grid';

const currentMonthShift = (): MonthShift => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

const CalendarPage = () => {
  const [{ month, year }, setMonthShift] = useState<MonthShift>(currentMonthShift);

  const calendarQuery = tsr.getCalendar.useQuery({
    queryKey: ['calendar', month, year],
    queryData: { query: { month, year } },
  });

  return (
    <Box sx={pageStyles}>
      <Typography variant="titleL" component="h1">
        Calendar
      </Typography>
      <Box sx={monthNavStyles}>
        <IconButton
          aria-label="Previous month"
          onClick={() => setMonthShift((current) => shiftMonth(current, -1))}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="titleM">{formatMonthLabel(month, year)}</Typography>
        <IconButton aria-label="Next month" onClick={() => setMonthShift((current) => shiftMonth(current, 1))}>
          <ChevronRightIcon />
        </IconButton>
      </Box>
      {calendarQuery.isPending ? (
        <CircularProgress aria-label="Loading calendar" />
      ) : (
        <MonthGrid month={month} year={year} sessions={calendarQuery.data?.body ?? []} />
      )}
    </Box>
  );
};

export default CalendarPage;
