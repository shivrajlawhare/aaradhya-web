import type { z } from 'zod';
import { EventStatus, type calendarSessionResultSchema } from '../../contract';

type CalendarSession = z.infer<typeof calendarSessionResultSchema>;
// Only the fields this module actually reads — narrower than the full
// CalendarSession (still satisfied by one), so a test fixture doesn't
// need to fill in every unrelated Session field (setup, items, pax, ...),
// the same Pick pattern calendar-events.ts already established.
type FilterableSession = Pick<CalendarSession, 'venue' | 'event'>;

// 'All' clears the status filter entirely (this story's own AC) — not a
// fifth EventStatus member, so it can never collide with a real value.
export type StatusFilterValue = EventStatus | 'All';

export interface CalendarFilters {
  status: StatusFilterValue;
  venue: string | null;
  eventManagerId: string | null;
  eventFamilyType: string | null;
}

export const DEFAULT_CALENDAR_FILTERS: CalendarFilters = {
  status: 'All',
  venue: null,
  eventManagerId: null,
  eventFamilyType: null,
};

// Every dimension is independently optional and AND-combined — the same
// semantics STORY-036's own GET /events/search uses server-side, applied
// here client-side against the already-fetched month (this story's own
// Decisions: filtering the calendar doesn't need a second round-trip,
// since status/venue/eventManager/eventFamilyType are all already present
// on every session GET /calendar returns).
export const filterCalendarSessions = <T extends FilterableSession>(sessions: T[], filters: CalendarFilters): T[] =>
  sessions.filter((session) => {
    if (filters.status !== 'All' && session.event.status !== filters.status) {
      return false;
    }
    if (filters.venue !== null && session.venue !== filters.venue) {
      return false;
    }
    if (filters.eventManagerId !== null && session.event.eventManager !== filters.eventManagerId) {
      return false;
    }
    if (filters.eventFamilyType !== null && session.event.eventFamilyType !== filters.eventFamilyType) {
      return false;
    }
    return true;
  });

// Sourced from the currently-visible month's own sessions (this story's
// own AC: "sourced from actual existing values, not a hardcoded list") —
// deliberately not all-time across every Event ever, since a value with
// zero sessions this month couldn't produce any result once combined with
// the month view anyway.
export const getDistinctVenues = (sessions: Pick<CalendarSession, 'venue'>[]): string[] =>
  [...new Set(sessions.map((session) => session.venue))].sort();

export const getDistinctEventFamilyTypes = (
  sessions: Pick<CalendarSession, 'event'>[],
): string[] => [...new Set(sessions.map((session) => session.event.eventFamilyType))].sort();

// Whether any filter dimension is actually narrowing the grid — used to
// decide whether a zero-result grid means "no filter combination could
// possibly match" (this story's own edge case message) versus "there's
// just nothing on the calendar this month."
export const isCalendarFiltered = (filters: CalendarFilters): boolean =>
  filters.status !== 'All' || filters.venue !== null || filters.eventManagerId !== null || filters.eventFamilyType !== null;
