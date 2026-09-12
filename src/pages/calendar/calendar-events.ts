import type { z } from 'zod';
import type { calendarSessionResultSchema } from '../../contract';

type CalendarSession = z.infer<typeof calendarSessionResultSchema>;
type CalendarEventSummary = CalendarSession['event'];
// Only the three fields this module actually reads — narrower than the
// full CalendarSession (still satisfied by one, since Pick only drops
// fields, never adds any), so a test can build a fixture without also
// filling in every unrelated Session field (setup, items, pax, ...).
type CalendarSessionOverlap = Pick<CalendarSession, 'startDate' | 'endDate' | 'event'>;

// A session's own startDate/endDate are wire-format ISO strings; comparing
// their 'YYYY-MM-DD' prefixes lexicographically is equivalent to comparing
// them chronologically and, unlike constructing `Date` objects from them,
// can never apply a viewer's local timezone (same date-as-string
// reasoning date-input.ts's toDateInputValue already established).
const sessionCoversDate = (session: CalendarSessionOverlap, date: string): boolean =>
  session.startDate.slice(0, 10) <= date && date <= session.endDate.slice(0, 10);

// Every session GET /calendar returns is already Active for its own
// overlap with the queried month (STORY-034's own guarantee) — no
// sessionStatus check needed here, only "does THIS session's own range
// cover THIS specific day," since the backend's month-level overlap
// doesn't imply per-day coverage.
//
// De-dupes to one chip per Event per day (this story's own AC) — two
// Sessions of the same Event both covering `date` collapse into a single
// entry, keeping the first session's own event summary.
export const getEventsOnDate = (sessions: CalendarSessionOverlap[], date: string): CalendarEventSummary[] => {
  const seenEventIds = new Set<string>();
  const events: CalendarEventSummary[] = [];

  for (const session of sessions) {
    if (!sessionCoversDate(session, date) || seenEventIds.has(session.event.id)) {
      continue;
    }
    seenEventIds.add(session.event.id);
    events.push(session.event);
  }

  return events;
};
