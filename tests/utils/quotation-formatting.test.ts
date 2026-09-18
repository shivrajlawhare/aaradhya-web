import { describe, expect, it } from 'vitest';
import {
  formatEventDate,
  formatQuotationPax,
  formatSessionDuration,
  formatTimeOfDay,
} from '../../src/utils/quotation-formatting';

describe('formatTimeOfDay', () => {
  it('formats an on-the-hour time with no minutes shown', () => {
    expect(formatTimeOfDay('18:00')).toBe('6pm');
    expect(formatTimeOfDay('09:00')).toBe('9am');
  });

  it('formats a time with non-zero minutes', () => {
    expect(formatTimeOfDay('18:30')).toBe('6:30pm');
  });

  it('uses lowercase am/pm with no space before them', () => {
    expect(formatTimeOfDay('15:00')).not.toMatch(/ /);
    expect(formatTimeOfDay('15:00')).not.toMatch(/AM|PM/);
  });

  it('returns an empty string for a blank or invalid time', () => {
    expect(formatTimeOfDay('')).toBe('');
    expect(formatTimeOfDay('not-a-time')).toBe('');
  });

  it('formats midnight and noon correctly', () => {
    expect(formatTimeOfDay('00:00')).toBe('12am');
    expect(formatTimeOfDay('12:00')).toBe('12pm');
  });
});

describe('formatSessionDuration', () => {
  it('formats "<start> to <end>" for both times set, matching the reference examples exactly', () => {
    expect(formatSessionDuration('18:00', '22:00')).toBe('6pm to 10pm');
    expect(formatSessionDuration('09:00', '15:00')).toBe('9am to 3pm');
  });

  it('falls back to just the one side when the other is blank', () => {
    expect(formatSessionDuration('18:00', '')).toBe('6pm');
    expect(formatSessionDuration('', '22:00')).toBe('10pm');
  });

  it('returns an empty string when both sides are blank', () => {
    expect(formatSessionDuration('', '')).toBe('');
  });
});

describe('formatEventDate', () => {
  it('formats YYYY-MM-DD as DD/MM/YYYY', () => {
    expect(formatEventDate('2026-09-12')).toBe('12/09/2026');
  });

  it('returns an empty string for a blank or invalid date', () => {
    expect(formatEventDate('')).toBe('');
    expect(formatEventDate('not-a-date')).toBe('');
  });
});

describe('formatQuotationPax', () => {
  it('formats a bare number when limited_seating is off', () => {
    expect(formatQuotationPax(200, false)).toBe('200');
  });

  it('formats "L.S. (Npax)" when limited_seating is on, using the literal pax entered', () => {
    expect(formatQuotationPax(200, true)).toBe('L.S. (200pax)');
  });
});
