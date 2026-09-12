import { useState } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import { tsr } from '../../api/client';
import { formatMonthLabel, shiftMonth, type MonthShift } from './calendar-dates';
import {
  DEFAULT_CALENDAR_FILTERS,
  filterCalendarSessions,
  getDistinctEventFamilyTypes,
  getDistinctVenues,
  isCalendarFiltered,
  type CalendarFilters,
} from './calendar-filters';
import { monthNavStyles, pageStyles } from './calendar-page.styles';
import FilterChipRow from './filter-chip-row';
import MonthGrid from './month-grid';

const currentMonthShift = (): MonthShift => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

const CalendarPage = () => {
  const [{ month, year }, setMonthShift] = useState<MonthShift>(currentMonthShift);
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_CALENDAR_FILTERS);

  const calendarQuery = tsr.getCalendar.useQuery({
    queryKey: ['calendar', month, year],
    queryData: { query: { month, year } },
  });
  const eventManagersQuery = tsr.listEventManagers.useQuery({ queryKey: ['event-managers'] });

  const monthSessions = calendarQuery.data?.body ?? [];
  const filteredSessions = filterCalendarSessions(monthSessions, filters);
  const eventManagerOptions = (eventManagersQuery.data?.body ?? []).map((manager) => ({
    value: manager.id,
    label: manager.name,
  }));

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
      <FilterChipRow
        filters={filters}
        onFiltersChange={setFilters}
        venueOptions={getDistinctVenues(monthSessions)}
        eventFamilyTypeOptions={getDistinctEventFamilyTypes(monthSessions)}
        eventManagerOptions={eventManagerOptions}
      />
      {calendarQuery.isPending ? (
        <CircularProgress aria-label="Loading calendar" />
      ) : (
        <>
          {isCalendarFiltered(filters) && filteredSessions.length === 0 && (
            <Typography variant="bodyM">No Events match the selected filters.</Typography>
          )}
          <MonthGrid month={month} year={year} sessions={filteredSessions} />
        </>
      )}
    </Box>
  );
};

export default CalendarPage;
