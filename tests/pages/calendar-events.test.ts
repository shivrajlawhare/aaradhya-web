import { describe, expect, it } from 'vitest';
import { EventStatus } from '../../src/contract';
import { getEventsOnDate } from '../../src/pages/calendar/calendar-events';

interface MockSessionOverlap {
  startDate: string;
  endDate: string;
  event: { id: string; eventFamilyType: string; status: EventStatus };
}

const makeSession = (overrides: Partial<MockSessionOverlap> = {}): MockSessionOverlap => ({
  startDate: '2026-09-12T00:00:00.000Z',
  endDate: '2026-09-14T00:00:00.000Z',
  event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Tentative },
  ...overrides,
});

describe('getEventsOnDate', () => {
  it("is present on every one of a fixture 3-day session's dates, including the middle day", () => {
    const session = makeSession({ startDate: '2026-09-12T00:00:00.000Z', endDate: '2026-09-14T00:00:00.000Z' });

    expect(getEventsOnDate([session], '2026-09-12').map((event) => event.id)).toEqual(['event-1']);
    expect(getEventsOnDate([session], '2026-09-13').map((event) => event.id)).toEqual(['event-1']);
    expect(getEventsOnDate([session], '2026-09-14').map((event) => event.id)).toEqual(['event-1']);
  });

  it('excludes a session on a day outside its own range', () => {
    const session = makeSession({ startDate: '2026-09-12T00:00:00.000Z', endDate: '2026-09-14T00:00:00.000Z' });

    expect(getEventsOnDate([session], '2026-09-15')).toEqual([]);
  });

  it('collapses two Sessions of the same Event active on the same day into one entry', () => {
    const sessions = [
      makeSession({
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Tentative },
      }),
      makeSession({
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Tentative },
      }),
    ];

    const events = getEventsOnDate(sessions, '2026-09-12');

    expect(events).toHaveLength(1);
  });

  it('keeps two different Events active on the same day as two separate entries', () => {
    const sessions = [
      makeSession({
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Tentative },
      }),
      makeSession({
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-2', eventFamilyType: 'Corporate Offsite', status: EventStatus.Confirmed },
      }),
    ];

    const events = getEventsOnDate(sessions, '2026-09-12');

    expect(events.map((event) => event.id).sort()).toEqual(['event-1', 'event-2']);
  });
});
