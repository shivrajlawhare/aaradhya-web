import { describe, expect, it } from 'vitest';
import { getRangeEndDateProps, isEndBeforeStart } from '../../src/components/ui/range-end-date-props';

describe('getRangeEndDateProps (R8, V5)', () => {
  it('limits the end to the start and opens on the start month', () => {
    const { minDate, referenceDate } = getRangeEndDateProps('2027-03-02');

    expect(minDate?.format('YYYY-MM-DD')).toBe('2027-03-02');
    expect(referenceDate?.format('YYYY-MM-DD')).toBe('2027-03-02');
  });

  it('adds nothing when there is no start, so the calendar opens on the current month', () => {
    expect(getRangeEndDateProps('')).toEqual({});
  });
});

describe('isEndBeforeStart', () => {
  it('is true only when both are set and the end is earlier', () => {
    expect(isEndBeforeStart('2027-03-02', '2027-03-01')).toBe(true);
    expect(isEndBeforeStart('2027-03-02', '2027-03-02')).toBe(false);
    expect(isEndBeforeStart('2027-03-02', '')).toBe(false);
    expect(isEndBeforeStart('', '2027-03-01')).toBe(false);
  });
});
