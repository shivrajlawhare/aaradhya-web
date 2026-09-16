import { describe, expect, it } from 'vitest';
import { EventStatus } from '../../src/contract';
import { mapSessionsToSchedulerEvents, STATUS_RESOURCES } from '../../src/pages/calendar/calendar-scheduler-events';

interface MockCalendarSession {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  event: { id: string; eventFamilyType: string; status: EventStatus; eventManager: string };
}

const makeSession = (overrides: Partial<MockCalendarSession> = {}): MockCalendarSession => ({
  id: 'session-1',
  startDate: '2026-09-12T00:00:00.000Z',
  endDate: '2026-09-12T00:00:00.000Z',
  startTime: null,
  endTime: null,
  event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Tentative, eventManager: 'manager-1' },
  ...overrides,
});

describe('mapSessionsToSchedulerEvents', () => {
  it('maps a single-day, timed session to one all-fields-set SchedulerEvent', () => {
    const [event] = mapSessionsToSchedulerEvents([
      makeSession({ startTime: '10:00', endTime: '14:00' }),
    ]);

    expect(event).toMatchObject({
      id: 'event-1',
      aaradhyaEventId: 'event-1',
      title: 'Wedding',
      start: '2026-09-12T10:00:00',
      end: '2026-09-12T14:00:00',
      allDay: false,
      resource: 'Tentative',
      readOnly: true,
    });
  });

  it('renders a multi-day session as one all-day range spanning its full start/end date', () => {
    const [event] = mapSessionsToSchedulerEvents([
      makeSession({ startDate: '2026-09-10T00:00:00.000Z', endDate: '2026-09-14T00:00:00.000Z' }),
    ]);

    expect(event).toMatchObject({
      start: '2026-09-10',
      end: '2026-09-14',
      allDay: true,
    });
  });

  it('merges two overlapping Sessions of the same Event into one range, not two — the overlap rule SRS §4.2 finalized', () => {
    const events = mapSessionsToSchedulerEvents([
      makeSession({ id: 'session-1', startDate: '2026-09-12T00:00:00.000Z', endDate: '2026-09-12T00:00:00.000Z' }),
      makeSession({ id: 'session-2', startDate: '2026-09-12T00:00:00.000Z', endDate: '2026-09-12T00:00:00.000Z' }),
    ]);

    expect(events).toHaveLength(1);
    expect(events[0]?.id).toBe('event-1');
  });

  it('keeps two non-overlapping Sessions of the same Event as two separate ranges, each with a composite id', () => {
    const events = mapSessionsToSchedulerEvents([
      makeSession({ id: 'session-1', startDate: '2026-03-01T00:00:00.000Z', endDate: '2026-03-01T00:00:00.000Z' }),
      makeSession({ id: 'session-2', startDate: '2026-06-15T00:00:00.000Z', endDate: '2026-06-15T00:00:00.000Z' }),
    ]);

    expect(events).toHaveLength(2);
    expect(events.map((event) => event.id).sort()).toEqual(['event-1-0', 'event-1-1']);
    expect(events.every((event) => event.aaradhyaEventId === 'event-1')).toBe(true);
  });

  it('never merges Sessions across two different Events, even on the same day', () => {
    const events = mapSessionsToSchedulerEvents([
      makeSession({
        id: 'session-1',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Tentative, eventManager: 'manager-1' },
      }),
      makeSession({
        id: 'session-2',
        event: { id: 'event-2', eventFamilyType: 'Corporate Offsite', status: EventStatus.Confirmed, eventManager: 'manager-1' },
      }),
    ]);

    expect(events).toHaveLength(2);
    expect(events.map((event) => event.aaradhyaEventId).sort()).toEqual(['event-1', 'event-2']);
  });

  it('sets resource to the Event\'s current status', () => {
    const [event] = mapSessionsToSchedulerEvents([
      makeSession({ event: { id: 'event-1', eventFamilyType: 'Wedding', status: EventStatus.Cancelled, eventManager: 'manager-1' } }),
    ]);

    expect(event?.resource).toBe('Cancelled');
  });
});

describe('STATUS_RESOURCES', () => {
  it('has exactly one resource per EventStatus value, each with a distinct eventColor', () => {
    expect(STATUS_RESOURCES.map((resource) => resource.id).sort()).toEqual([
      'Cancelled',
      'Completed',
      'Confirmed',
      'Tentative',
    ]);
    const colors = STATUS_RESOURCES.map((resource) => resource.eventColor);
    expect(new Set(colors).size).toBe(colors.length);
  });
});
