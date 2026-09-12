import { describe, expect, it } from 'vitest';
import { buildMonthGrid, dayOfMonth, formatMonthLabel, isInMonth, shiftMonth } from '../../src/pages/calendar/calendar-dates';

describe('buildMonthGrid', () => {
  it('pads a month that starts mid-week with the previous month\'s trailing days (5-week grid)', () => {
    // September 2026: 1st is a Tuesday, 30th is a Wednesday.
    const weeks = buildMonthGrid(9, 2026);

    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toEqual([
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
    ]);
    expect(weeks[4]).toEqual([
      '2026-09-27',
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
    ]);
  });

  it('needs a 6th row when the month starts on a Saturday with 31 days', () => {
    // August 2026: 1st is a Saturday, 31st is a Monday.
    const weeks = buildMonthGrid(8, 2026);

    expect(weeks).toHaveLength(6);
    expect(weeks[0]?.[0]).toBe('2026-07-26');
    expect(weeks[5]?.[6]).toBe('2026-09-05');
  });

  it('needs only 4 rows when the month starts on Sunday and has exactly 28 days', () => {
    // February 2026: 1st is a Sunday, 28th is a Saturday — no padding at all.
    const weeks = buildMonthGrid(2, 2026);

    expect(weeks).toHaveLength(4);
    expect(weeks[0]?.[0]).toBe('2026-02-01');
    expect(weeks[3]?.[6]).toBe('2026-02-28');
  });

  it('every week has exactly 7 days, Sunday to Saturday', () => {
    const weeks = buildMonthGrid(9, 2026);

    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
  });
});

describe('isInMonth', () => {
  it('is true for a date within the queried month', () => {
    expect(isInMonth('2026-09-12', 9, 2026)).toBe(true);
  });

  it('is false for a leading out-of-month padding day', () => {
    expect(isInMonth('2026-08-30', 9, 2026)).toBe(false);
  });

  it('is false for a trailing out-of-month padding day', () => {
    expect(isInMonth('2026-10-02', 9, 2026)).toBe(false);
  });
});

describe('dayOfMonth', () => {
  it('reads the calendar day number out of a YYYY-MM-DD string', () => {
    expect(dayOfMonth('2026-09-05')).toBe(5);
    expect(dayOfMonth('2026-09-30')).toBe(30);
  });
});

describe('shiftMonth', () => {
  it('moves forward within the same year', () => {
    expect(shiftMonth({ month: 9, year: 2026 }, 1)).toEqual({ month: 10, year: 2026 });
  });

  it('moves backward within the same year', () => {
    expect(shiftMonth({ month: 9, year: 2026 }, -1)).toEqual({ month: 8, year: 2026 });
  });

  it('wraps forward across a year boundary', () => {
    expect(shiftMonth({ month: 12, year: 2026 }, 1)).toEqual({ month: 1, year: 2027 });
  });

  it('wraps backward across a year boundary', () => {
    expect(shiftMonth({ month: 1, year: 2026 }, -1)).toEqual({ month: 12, year: 2025 });
  });
});

describe('formatMonthLabel', () => {
  it('formats a month/year as a readable label', () => {
    expect(formatMonthLabel(9, 2026)).toBe('September 2026');
  });

  it('never shifts a day due to a local timezone (formats in UTC)', () => {
    expect(formatMonthLabel(1, 2027)).toBe('January 2027');
  });
});
