import { describe, expect, it } from 'vitest';
import { EventStatus } from '../../src/contract';
import {
  type CalendarFilters,
  DEFAULT_CALENDAR_FILTERS,
  filterCalendarSessions,
  getDistinctEventFamilyTypes,
  getDistinctVenues,
  isCalendarFiltered,
} from '../../src/pages/calendar/calendar-filters';

interface MockCalendarSession {
  id: string;
  sessionType: string;
  venue: string;
  venueCost: number;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  pax: number;
  sessionStatus: string;
  durationDays: number;
  isMultiDay: boolean;
  setup: {
    seating: string | null;
    tableCount: number;
    chairCount: number;
    stage: boolean;
    buffet: boolean;
    registrationDesk: boolean;
    vipSeating: boolean;
    brideGroomSeating: boolean;
    notes: string | null;
  };
  items: unknown[];
  event: { id: string; eventFamilyType: string; status: EventStatus; eventManager: string };
}

const makeSession = (overrides: Partial<MockCalendarSession> = {}): MockCalendarSession => ({
  id: 'session-1',
  sessionType: 'Wedding',
  venue: 'Lawn',
  venueCost: 50000,
  startDate: '2026-09-12T00:00:00.000Z',
  endDate: '2026-09-12T00:00:00.000Z',
  startTime: null,
  endTime: null,
  pax: 200,
  sessionStatus: 'Active',
  durationDays: 1,
  isMultiDay: false,
  setup: {
    seating: null,
    tableCount: 0,
    chairCount: 0,
    stage: false,
    buffet: false,
    registrationDesk: false,
    vipSeating: false,
    brideGroomSeating: false,
    notes: null,
  },
  items: [],
  event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Tentative, eventManager: 'manager-1' },
  ...overrides,
});

describe('filterCalendarSessions', () => {
  it('returns every session unfiltered when every filter dimension is unset (DEFAULT_CALENDAR_FILTERS)', () => {
    const sessions = [makeSession(), makeSession({ id: 'session-2' })];

    expect(filterCalendarSessions(sessions, DEFAULT_CALENDAR_FILTERS)).toHaveLength(2);
  });

  it('narrows by status, excluding a session whose Event has a different status', () => {
    const tentative = makeSession({
      event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Tentative, eventManager: 'manager-1' },
    });
    const confirmed = makeSession({
      id: 'session-2',
      event: { id: 'event-2', eventFamilyType: 'Wedding', status: EventStatus.Confirmed, eventManager: 'manager-1' },
    });
    const filters: CalendarFilters = { ...DEFAULT_CALENDAR_FILTERS, status: EventStatus.Confirmed };

    const result = filterCalendarSessions([tentative, confirmed], filters);

    expect(result.map((session) => session.id)).toEqual(['session-2']);
  });

  it('"All" clears the status filter — every status matches again', () => {
    const sessions = [
      makeSession({
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Tentative, eventManager: 'manager-1' },
      }),
      makeSession({
        id: 'session-2',
        event: { id: 'event-2', eventFamilyType: 'Wedding', status: EventStatus.Confirmed, eventManager: 'manager-1' },
      }),
    ];
    const filters: CalendarFilters = { ...DEFAULT_CALENDAR_FILTERS, status: 'All' };

    expect(filterCalendarSessions(sessions, filters)).toHaveLength(2);
  });

  it('narrows by venue', () => {
    const lawn = makeSession({ venue: 'Lawn' });
    const poolside = makeSession({ id: 'session-2', venue: 'Poolside' });
    const filters: CalendarFilters = { ...DEFAULT_CALENDAR_FILTERS, venue: 'Lawn' };

    expect(filterCalendarSessions([lawn, poolside], filters).map((s) => s.id)).toEqual(['session-1']);
  });

  it('narrows by eventManagerId', () => {
    const managerA = makeSession({
      event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Tentative, eventManager: 'manager-a' },
    });
    const managerB = makeSession({
      id: 'session-2',
      event: { id: 'event-2', eventFamilyType: 'Wedding', status: EventStatus.Tentative, eventManager: 'manager-b' },
    });
    const filters: CalendarFilters = { ...DEFAULT_CALENDAR_FILTERS, eventManagerId: 'manager-a' };

    expect(filterCalendarSessions([managerA, managerB], filters).map((s) => s.id)).toEqual(['session-1']);
  });

  it('narrows by eventFamilyType', () => {
    const wedding = makeSession({
      event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Tentative, eventManager: 'manager-1' },
    });
    const corporate = makeSession({
      id: 'session-2',
      event: {
        id: 'event-2',
        eventFamilyType: 'Corporate Offsite',
        status: EventStatus.Tentative,
        eventManager: 'manager-1',
      },
    });
    const filters: CalendarFilters = { ...DEFAULT_CALENDAR_FILTERS, eventFamilyType: 'Wedding' };

    expect(filterCalendarSessions([wedding, corporate], filters).map((s) => s.id)).toEqual(['session-1']);
  });

  // STORY-060's own "Event" filter — a second, independent dropdown over
  // the same eventFamilyType dimension as Event Type above (per product
  // direction, not a search-by-specific-Event selector).
  it('narrows by event (the same dimension as eventFamilyType, offered as its own filter)', () => {
    const wedding = makeSession({
      event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Tentative, eventManager: 'manager-1' },
    });
    const corporate = makeSession({
      id: 'session-2',
      event: {
        id: 'event-2',
        eventFamilyType: 'Corporate Offsite',
        status: EventStatus.Tentative,
        eventManager: 'manager-1',
      },
    });
    const filters: CalendarFilters = { ...DEFAULT_CALENDAR_FILTERS, event: 'Wedding' };

    expect(filterCalendarSessions([wedding, corporate], filters).map((s) => s.id)).toEqual(['session-1']);
  });

  it('AND-combines event with eventFamilyType — a session matching only one of two different values matches neither', () => {
    const wedding = makeSession({
      event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Tentative, eventManager: 'manager-1' },
    });
    const filters: CalendarFilters = {
      ...DEFAULT_CALENDAR_FILTERS,
      eventFamilyType: 'Wedding',
      event: 'Corporate Offsite',
    };

    expect(filterCalendarSessions([wedding], filters)).toEqual([]);
  });

  it('combines multiple filter dimensions with AND semantics', () => {
    const matches = makeSession({
      venue: 'Lawn',
      event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Confirmed, eventManager: 'manager-1' },
    });
    const wrongVenue = makeSession({
      id: 'session-2',
      venue: 'Poolside',
      event: { id: 'event-2', eventFamilyType: 'Wedding', status: EventStatus.Confirmed, eventManager: 'manager-1' },
    });
    const filters: CalendarFilters = { ...DEFAULT_CALENDAR_FILTERS, venue: 'Lawn', status: EventStatus.Confirmed };

    expect(filterCalendarSessions([matches, wrongVenue], filters).map((s) => s.id)).toEqual(['session-1']);
  });

  it('returns an empty array when a filter combination matches nothing', () => {
    const session = makeSession({ venue: 'Lawn' });
    const filters: CalendarFilters = { ...DEFAULT_CALENDAR_FILTERS, venue: 'Poolside' };

    expect(filterCalendarSessions([session], filters)).toEqual([]);
  });
});

describe('getDistinctVenues', () => {
  it('returns each distinct venue once, sorted', () => {
    const sessions = [
      makeSession({ venue: 'Poolside' }),
      makeSession({ id: 'session-2', venue: 'Lawn' }),
      makeSession({ id: 'session-3', venue: 'Lawn' }),
    ];

    expect(getDistinctVenues(sessions)).toEqual(['Lawn', 'Poolside']);
  });
});

describe('getDistinctEventFamilyTypes', () => {
  it('returns each distinct eventFamilyType once, sorted', () => {
    const sessions = [
      makeSession({
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Tentative, eventManager: 'manager-1' },
      }),
      makeSession({
        id: 'session-2',
        event: {
          id: 'event-2',
          eventFamilyType: 'Corporate Offsite',
          status: EventStatus.Tentative,
          eventManager: 'manager-1',
        },
      }),
      makeSession({
        id: 'session-3',
        event: { id: 'event-3', eventFamilyType: 'Wedding', status: EventStatus.Tentative, eventManager: 'manager-1' },
      }),
    ];

    expect(getDistinctEventFamilyTypes(sessions)).toEqual(['Corporate Offsite', 'Wedding']);
  });
});

describe('isCalendarFiltered', () => {
  it('is false when every filter dimension is unset', () => {
    expect(isCalendarFiltered(DEFAULT_CALENDAR_FILTERS)).toBe(false);
  });

  it.each([
    ['status', { ...DEFAULT_CALENDAR_FILTERS, status: EventStatus.Confirmed }],
    ['venue', { ...DEFAULT_CALENDAR_FILTERS, venue: 'Lawn' }],
    ['eventManagerId', { ...DEFAULT_CALENDAR_FILTERS, eventManagerId: 'manager-1' }],
    ['eventFamilyType', { ...DEFAULT_CALENDAR_FILTERS, eventFamilyType: 'Wedding' }],
    ['event', { ...DEFAULT_CALENDAR_FILTERS, event: 'Wedding' }],
  ])('is true once %s is set', (_dimension, filters: CalendarFilters) => {
    expect(isCalendarFiltered(filters)).toBe(true);
  });
});
