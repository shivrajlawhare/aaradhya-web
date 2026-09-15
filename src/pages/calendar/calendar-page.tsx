import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { tsr } from '../../api/client';
import { formatMonthLabel, shiftMonth, type MonthShift } from './calendar-dates';
import {
  filterCalendarSessions,
  getDistinctEventFamilyTypes,
  getDistinctVenues,
  isCalendarFiltered,
  type CalendarFilters,
} from './calendar-filters';
import { buildCalendarSearchParams, parseCalendarSearchParams } from './calendar-url-state';
import { monthNavStyles, pageStyles } from './calendar-page.styles';
import FilterChipRow from './filter-chip-row';
import MonthGrid from './month-grid';

const currentMonthShift = (): MonthShift => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

const CalendarPage = () => {
  // The URL is the single source of truth for month/filter state (not
  // useState) — this story's own AC: back-navigation from an Event's
  // detail screen must restore whichever month/filters were active,
  // which only survives a full unmount/remount (what browser Back
  // actually does) if it lives in the location itself, not component
  // state that resets on remount.
  const [searchParams, setSearchParams] = useSearchParams();
  const { monthShift, filters } = parseCalendarSearchParams(searchParams, currentMonthShift());
  const { month, year } = monthShift;

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

  // `replace: true` — changing the month or a filter updates the current
  // history entry rather than pushing a new one, so Back from the
  // calendar itself returns to wherever the user was before arriving
  // (e.g. the dashboard), not one filter tweak at a time. Navigating away
  // to an Event's detail screen is a separate, genuine push (react-router's
  // own default), so Back from there lands on the calendar's latest state.
  const updateMonthShift = (next: MonthShift) => {
    setSearchParams(buildCalendarSearchParams(next, filters), { replace: true });
  };
  const updateFilters = (next: CalendarFilters) => {
    setSearchParams(buildCalendarSearchParams(monthShift, next), { replace: true });
  };

  return (
    <Box sx={pageStyles}>
      <Box sx={monthNavStyles}>
        <IconButton aria-label="Previous month" onClick={() => updateMonthShift(shiftMonth(monthShift, -1))}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="titleM">{formatMonthLabel(month, year)}</Typography>
        <IconButton aria-label="Next month" onClick={() => updateMonthShift(shiftMonth(monthShift, 1))}>
          <ChevronRightIcon />
        </IconButton>
      </Box>
      <FilterChipRow
        filters={filters}
        onFiltersChange={updateFilters}
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
