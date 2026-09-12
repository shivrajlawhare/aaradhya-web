import { EventStatus } from '../../contract';
import type { MonthShift } from './calendar-dates';
import { type CalendarFilters, type StatusFilterValue } from './calendar-filters';

// Every real EventStatus member keyed to itself — turns an unchecked
// string from the URL into a validated StatusFilterValue with a graceful
// 'All' fallback, no `as` cast and no hand-rolled `is` type guard
// (typescript-rules.md rule 1), same reasoning overview-tab.tsx's own
// Select-driven EventStatus narrowing avoids a cast, just applied to an
// actually-unchecked source (a URL, not a fully-typed form control).
const STATUS_LOOKUP: Record<string, EventStatus> = Object.fromEntries(
  Object.values(EventStatus).map((status) => [status, status]),
);

// Query param names deliberately differ from CalendarFilters' own field
// names (eventManagerId -> eventManager, eventFamilyType -> eventType) —
// shorter, and eventType matches this story's own AC/spec wording, the
// same "public param name vs. actual field name" call STORY-036's own
// eventFamilyType query param made in the other direction.
const MONTH_PARAM = 'month';
const YEAR_PARAM = 'year';
const STATUS_PARAM = 'status';
const VENUE_PARAM = 'venue';
const EVENT_MANAGER_PARAM = 'eventManager';
const EVENT_TYPE_PARAM = 'eventType';

// Reads whatever combination of params is present, falling back field by
// field (not all-or-nothing) so a URL with only `?status=Confirmed` still
// shows the current month rather than some invalid one — this story's own
// AC only asks that back-navigation restore state that was actually set,
// not that every param be present together.
export const parseCalendarSearchParams = (
  searchParams: URLSearchParams,
  fallbackMonthShift: MonthShift,
): { monthShift: MonthShift; filters: CalendarFilters } => {
  const monthParam = Number(searchParams.get(MONTH_PARAM));
  const yearParam = Number(searchParams.get(YEAR_PARAM));
  const monthShift: MonthShift =
    Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 12 && Number.isInteger(yearParam)
      ? { month: monthParam, year: yearParam }
      : fallbackMonthShift;

  const statusParam = searchParams.get(STATUS_PARAM);
  const status: StatusFilterValue = statusParam ? (STATUS_LOOKUP[statusParam] ?? 'All') : 'All';

  const filters: CalendarFilters = {
    status,
    venue: searchParams.get(VENUE_PARAM),
    eventManagerId: searchParams.get(EVENT_MANAGER_PARAM),
    eventFamilyType: searchParams.get(EVENT_TYPE_PARAM),
  };

  return { monthShift, filters };
};

// Omits a filter's own param entirely when unset, rather than writing an
// empty string — keeps the URL as clean as the equivalent GET /calendar
// query would be, and round-trips cleanly back through
// parseCalendarSearchParams' own `searchParams.get(...) ?? null` reads.
export const buildCalendarSearchParams = (monthShift: MonthShift, filters: CalendarFilters): URLSearchParams => {
  const params = new URLSearchParams();
  params.set(MONTH_PARAM, String(monthShift.month));
  params.set(YEAR_PARAM, String(monthShift.year));
  if (filters.status !== 'All') {
    params.set(STATUS_PARAM, filters.status);
  }
  if (filters.venue !== null) {
    params.set(VENUE_PARAM, filters.venue);
  }
  if (filters.eventManagerId !== null) {
    params.set(EVENT_MANAGER_PARAM, filters.eventManagerId);
  }
  if (filters.eventFamilyType !== null) {
    params.set(EVENT_TYPE_PARAM, filters.eventFamilyType);
  }
  return params;
};
