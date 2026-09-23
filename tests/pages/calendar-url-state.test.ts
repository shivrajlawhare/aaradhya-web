import { describe, expect, it } from 'vitest';
import { EventStatus } from '../../src/contract';
import { type CalendarFilters, DEFAULT_CALENDAR_FILTERS } from '../../src/pages/calendar/calendar-filters';
import { buildCalendarSearchParams, parseCalendarSearchParams } from '../../src/pages/calendar/calendar-url-state';

describe('parseCalendarSearchParams', () => {
  it('falls back to the given month/year and default filters when the URL has no params at all', () => {
    const fallback = { month: 9, year: 2026 };

    const result = parseCalendarSearchParams(new URLSearchParams(), fallback);

    expect(result.monthShift).toEqual(fallback);
    expect(result.filters).toEqual(DEFAULT_CALENDAR_FILTERS);
  });

  it('reads a valid month/year from the URL', () => {
    const result = parseCalendarSearchParams(new URLSearchParams('month=10&year=2026'), { month: 1, year: 2000 });

    expect(result.monthShift).toEqual({ month: 10, year: 2026 });
  });

  it('falls back to the given month/year when the URL value is out of range', () => {
    const fallback = { month: 9, year: 2026 };

    const result = parseCalendarSearchParams(new URLSearchParams('month=13&year=2026'), fallback);

    expect(result.monthShift).toEqual(fallback);
  });

  it('reads a valid status filter from the URL', () => {
    const result = parseCalendarSearchParams(new URLSearchParams('status=Confirmed'), { month: 9, year: 2026 });

    expect(result.filters.status).toBe(EventStatus.Confirmed);
  });

  it('falls back to "All" for an unrecognized status value, rather than passing it through', () => {
    const result = parseCalendarSearchParams(new URLSearchParams('status=NotARealStatus'), { month: 9, year: 2026 });

    expect(result.filters.status).toBe('All');
  });

  it('reads venue/eventManager/eventType/event filters from the URL', () => {
    const result = parseCalendarSearchParams(
      new URLSearchParams('venue=Lawn&eventManager=manager-1&eventType=Wedding&event=Corporate Offsite'),
      { month: 9, year: 2026 }
    );

    expect(result.filters).toEqual({
      status: 'All',
      venue: 'Lawn',
      eventManagerId: 'manager-1',
      eventFamilyType: 'Wedding',
      event: 'Corporate Offsite',
    });
  });

  it('reads only the params that are present, defaulting the rest', () => {
    const result = parseCalendarSearchParams(new URLSearchParams('status=Confirmed'), { month: 9, year: 2026 });

    expect(result.filters).toEqual({
      status: EventStatus.Confirmed,
      venue: null,
      eventManagerId: null,
      eventFamilyType: null,
      event: null,
    });
  });
});

describe('buildCalendarSearchParams', () => {
  it('always writes month/year', () => {
    const params = buildCalendarSearchParams({ month: 9, year: 2026 }, DEFAULT_CALENDAR_FILTERS);

    expect(params.get('month')).toBe('9');
    expect(params.get('year')).toBe('2026');
  });

  it('omits every filter param when no filter is active', () => {
    const params = buildCalendarSearchParams({ month: 9, year: 2026 }, DEFAULT_CALENDAR_FILTERS);

    expect(params.has('status')).toBe(false);
    expect(params.has('venue')).toBe(false);
    expect(params.has('eventManager')).toBe(false);
    expect(params.has('eventType')).toBe(false);
    expect(params.has('event')).toBe(false);
  });

  it('writes the event filter', () => {
    const params = buildCalendarSearchParams(
      { month: 9, year: 2026 },
      { ...DEFAULT_CALENDAR_FILTERS, event: 'Wedding' }
    );

    expect(params.get('event')).toBe('Wedding');
  });

  it('writes only the filters that are actually set', () => {
    const filters: CalendarFilters = {
      status: EventStatus.Confirmed,
      venue: 'Lawn',
      eventManagerId: null,
      eventFamilyType: null,
      event: null,
    };

    const params = buildCalendarSearchParams({ month: 9, year: 2026 }, filters);

    expect(params.get('status')).toBe('Confirmed');
    expect(params.get('venue')).toBe('Lawn');
    expect(params.has('eventManager')).toBe(false);
    expect(params.has('eventType')).toBe(false);
    expect(params.has('event')).toBe(false);
  });

  it('round-trips through parseCalendarSearchParams unchanged', () => {
    const monthShift = { month: 10, year: 2026 };
    const filters: CalendarFilters = {
      status: EventStatus.Confirmed,
      venue: 'Lawn',
      eventManagerId: 'manager-1',
      eventFamilyType: 'Wedding',
      event: 'Corporate Offsite',
    };

    const params = buildCalendarSearchParams(monthShift, filters);
    const parsed = parseCalendarSearchParams(params, { month: 1, year: 2000 });

    expect(parsed.monthShift).toEqual(monthShift);
    expect(parsed.filters).toEqual(filters);
  });
});
