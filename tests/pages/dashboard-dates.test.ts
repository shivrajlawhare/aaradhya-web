import { describe, expect, it } from 'vitest';
import { formatEyebrowDate, formatGreeting, getDateBlockParts } from '../../src/pages/dashboard/dashboard-dates';

describe('dashboard dates', () => {
  it('formats the eyebrow as weekday, day month year', () => {
    expect(formatEyebrowDate(new Date(2026, 8, 24))).toBe('Thursday, 24 September 2026');
  });

  it.each([
    [9, 'Good morning, Priya'],
    [14, 'Good afternoon, Priya'],
    [19, 'Good evening, Priya'],
  ])('greets by the hour (%i:00) with the first name only', (hour, greeting) => {
    expect(formatGreeting(new Date(2026, 8, 24, hour), 'Priya Joshi')).toBe(greeting);
  });

  it('splits a stored date into the date block parts, keeping YYYY-MM-DD', () => {
    expect(getDateBlockParts('2026-12-12T00:00:00.000Z')).toEqual({
      isoDate: '2026-12-12',
      day: '12',
      month: 'Dec',
      weekday: 'Sat',
    });
  });
});
