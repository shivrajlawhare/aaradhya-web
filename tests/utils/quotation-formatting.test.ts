import { describe, expect, it } from 'vitest';
import {
  formatEventDate,
  formatQuotationItemCost,
  formatQuotationPax,
  formatQuotationRupees,
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

describe('formatQuotationItemCost', () => {
  it('formats a bare number with a trailing "/-", no digit grouping', () => {
    expect(formatQuotationItemCost(275)).toBe('275/-');
    // example_quatation_1.pdf's own "Chaat Counter" row — no comma even at
    // 5 digits.
    expect(formatQuotationItemCost(45000)).toBe('45000/-');
  });
});

describe('formatQuotationRupees', () => {
  it('formats a whole number with Indian digit grouping and a "Rs. ... /-" wrapper', () => {
    expect(formatQuotationRupees(109200)).toBe('Rs. 1,09,200 /-');
  });

  // STORY-072 — both reference quotations' own printed Grand Total
  // ("Rs. 10,73,208 /-" from an underlying 1073207.5, "Rs. 9,49,555 /-"
  // from 949555) round to the nearest whole rupee; Intl.NumberFormat's own
  // default maximumFractionDigits (3) would otherwise print the .5 verbatim.
  it('rounds a fractional amount to the nearest whole rupee', () => {
    expect(formatQuotationRupees(1073207.5)).toBe('Rs. 10,73,208 /-');
  });
});
