import { describe, expect, it } from 'vitest';
import { enumerateDates, getDistinctDates } from '../../src/utils/session-dates';

describe('enumerateDates', () => {
  it('is inclusive of both the start and end date', () => {
    expect(enumerateDates('2026-09-12', '2026-09-13')).toEqual(['2026-09-12', '2026-09-13']);
  });

  it('returns a single date for a same-day span', () => {
    expect(enumerateDates('2026-09-12', '2026-09-12')).toEqual(['2026-09-12']);
  });

  it('returns an empty array for an invalid date', () => {
    expect(enumerateDates('not-a-date', '2026-09-12')).toEqual([]);
  });
});

describe('getDistinctDates', () => {
  it('unions and sorts dates across multiple rows, de-duping overlaps', () => {
    expect(
      getDistinctDates([
        { startDate: '2026-09-12', endDate: '2026-09-13' },
        { startDate: '2026-09-13', endDate: '2026-09-14' },
      ]),
    ).toEqual(['2026-09-12', '2026-09-13', '2026-09-14']);
  });

  it('returns an empty array for no rows', () => {
    expect(getDistinctDates([])).toEqual([]);
  });
});
