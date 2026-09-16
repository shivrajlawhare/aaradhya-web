import type { SchedulerEvent, SchedulerResource } from '@mui/x-scheduler/models';
import type { z } from 'zod';
import { EventStatus, type calendarSessionResultSchema } from '../../contract';

type CalendarSession = z.infer<typeof calendarSessionResultSchema>;
// Only the fields this module actually reads — narrower than the full
// CalendarSession (still satisfied by one), so a test fixture doesn't need
// to fill in every unrelated Session field (venue, pax, setup, items, ...),
// the same Pick pattern calendar-filters.ts already established.
type SchedulableSession = Pick<CalendarSession, 'startDate' | 'endDate' | 'startTime' | 'endTime' | 'event'>;

// One resource per Event status (STORY-058's own AC — resources map to
// status, not Venue/Event Manager), so StandaloneMonthView's native
// resource-coloring reproduces the by-status coloring StatusChip/the old
// calendar chips already use everywhere else, instead of a manual override.
//
// `eventColor` only accepts the library's own fixed named palette (red,
// pink, purple, indigo, blue, teal, green, lime, amber, orange, grey) — its
// actual hex values are hardcoded inside @mui/x-scheduler-internals, not
// read from this app's theme, so the exact status-tentative/-confirmed/
// -completed/-cancelled hex tokens can't be reproduced literally. Each
// status is mapped to the closest, most distinct named color instead:
// amber for Tentative (near-exact hue match), red for Confirmed (closest
// family to its brick-red), grey for Completed (already a neutral), and
// purple for Cancelled (grey is taken, so the next-most-muted, clearly
// distinct option) — four visually distinct resources, not four shades of
// the same one.
export const STATUS_RESOURCES: SchedulerResource[] = [
  { id: EventStatus.Tentative, title: EventStatus.Tentative, eventColor: 'amber' },
  { id: EventStatus.Confirmed, title: EventStatus.Confirmed, eventColor: 'red' },
  { id: EventStatus.Completed, title: EventStatus.Completed, eventColor: 'grey' },
  { id: EventStatus.Cancelled, title: EventStatus.Cancelled, eventColor: 'purple' },
];

export interface MappedSchedulerEvent extends SchedulerEvent {
  // The real Aaradhya Event id — distinct from `id` above once an Event's
  // Sessions split into more than one non-overlapping range (STORY-058's
  // own AC edge case list doesn't cover this, but the same Event with a
  // September Session and a December one obviously can't be one calendar
  // entry), so navigation always lands on the actual Event, not a
  // synthetic per-range id.
  aaradhyaEventId: string;
}

// A session's own startDate/endDate are wire-format ISO strings; comparing
// their 'YYYY-MM-DD' prefixes lexicographically is equivalent to comparing
// them chronologically and, unlike constructing `Date` objects from them,
// can never apply a viewer's local timezone — same reasoning
// calendar-events.ts's own sessionCoversDate already established.
const dateOnly = (isoString: string): string => isoString.slice(0, 10);

interface MergedRange {
  startDate: string;
  endDate: string;
  // The one session's own start/end time — kept only for a range that
  // never merged more than one session — once two sessions merge, "whose
  // time wins" stops having one obviously correct answer, so both are
  // dropped and the range renders as all-day instead of guessing.
  startTime: string | null;
  endTime: string | null;
}

// Merges a single Event's own Sessions into the fewest calendar ranges that
// still show every day it's actually active — the overlap rule SRS §4.2
// already finalized (two Sessions of the same Event covering the same day
// collapse into one entry), re-targeted at StandaloneMonthView's own
// native multi-day rendering instead of the old hand-built per-cell dedupe
// (calendar-events.ts's now-retired getEventsOnDate). Non-overlapping
// Sessions of the same Event (a Mehendi in March, a reception in June) stay
// separate ranges — nothing between them is actually part of the Event.
const mergeSessionRanges = (sessions: SchedulableSession[]): MergedRange[] => {
  const sorted = [...sessions].sort((a, b) => dateOnly(a.startDate).localeCompare(dateOnly(b.startDate)));
  const ranges: MergedRange[] = [];

  for (const session of sorted) {
    const start = dateOnly(session.startDate);
    const end = dateOnly(session.endDate);
    const last = ranges[ranges.length - 1];
    if (last && start <= last.endDate) {
      if (end > last.endDate) {
        last.endDate = end;
      }
      // More than one session now covers this range — no single start/end
      // time is correct, so both are dropped rather than guessed at.
      last.startTime = null;
      last.endTime = null;
    } else {
      ranges.push({ startDate: start, endDate: end, startTime: session.startTime, endTime: session.endTime });
    }
  }

  return ranges;
};

// Combines a date with an optional 'HH:mm' time into the wall-time
// datetime string SchedulerEvent.start/end expects — no trailing 'Z', so
// it's read as-is rather than reinterpreted in the viewer's own timezone
// (same "never apply the client's local timezone" rule every other date
// field in this app already follows).
const toWallTime = (date: string, time: string | null): string => `${date}T${time ?? '00:00'}:00`;

// One SchedulerEvent per merged range per Event (STORY-058's own AC) — a
// single-day range with a real start time renders as StandaloneMonthView's
// own dot+time+label row; a multi-day range renders as its own bar,
// reproducing the library's native multi-day layout instead of a
// hand-built per-cell repeat.
export const mapSessionsToSchedulerEvents = (sessions: SchedulableSession[]): MappedSchedulerEvent[] => {
  const sessionsByEvent = new Map<string, SchedulableSession[]>();
  const eventById = new Map<string, SchedulableSession['event']>();
  for (const session of sessions) {
    const list = sessionsByEvent.get(session.event.id) ?? [];
    list.push(session);
    sessionsByEvent.set(session.event.id, list);
    eventById.set(session.event.id, session.event);
  }

  const events: MappedSchedulerEvent[] = [];
  for (const [eventId, eventSessions] of sessionsByEvent) {
    const event = eventById.get(eventId);
    if (!event) {
      continue;
    }
    const ranges = mergeSessionRanges(eventSessions);
    ranges.forEach((range, index) => {
      // Multi-day, or a merge that dropped its time — either way there's
      // no single start time left to show, so it renders as an all-day
      // range (a bar, per bullet 5) instead of a possibly zero-duration
      // timed event.
      const isAllDay = range.startDate !== range.endDate || range.startTime === null;
      events.push({
        id: ranges.length > 1 ? `${eventId}-${index}` : eventId,
        aaradhyaEventId: eventId,
        title: event.eventFamilyType,
        start: isAllDay ? range.startDate : toWallTime(range.startDate, range.startTime),
        end: isAllDay ? range.endDate : toWallTime(range.endDate, range.endTime ?? range.startTime),
        allDay: isAllDay,
        resource: event.status,
        readOnly: true,
      });
    });
  }

  return events;
};
