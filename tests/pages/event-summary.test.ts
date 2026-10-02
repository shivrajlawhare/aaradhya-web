import { describe, expect, it } from 'vitest';
import { ItemType, SessionStatus } from '../../src/contract';
import { computeEventSummary, formatDateRange } from '../../src/pages/event-detail/event-summary';
import { EXAMPLE_3_EVENT } from '../support/example-quotation-3';

const session = (overrides: Partial<Parameters<typeof computeEventSummary>[0]['sessions'][number]> = {}) => ({
  startDate: '2026-12-12T00:00:00.000Z',
  endDate: '2026-12-12T00:00:00.000Z',
  venue: 'Lawn',
  venueCost: 80000,
  pax: 250,
  sessionStatus: SessionStatus.Active,
  items: [],
  ...overrides,
});

describe('formatDateRange (Summary Strip)', () => {
  it('collapses a range within one month, as "12 – 14 Dec 2026"', () => {
    expect(formatDateRange('2026-12-12', '2026-12-14')).toBe('12 – 14 Dec 2026');
  });

  it('names both months across a month boundary', () => {
    expect(formatDateRange('2027-02-28', '2027-03-02')).toBe('28 Feb – 2 Mar 2027');
  });

  it('names both years across a year boundary', () => {
    expect(formatDateRange('2026-12-30', '2027-01-02')).toBe('30 Dec 2026 – 2 Jan 2027');
  });

  it('prints a single day once', () => {
    expect(formatDateRange('2026-12-12', '2026-12-12')).toBe('12 Dec 2026');
  });
});

describe('computeEventSummary', () => {
  it('rolls up dates, distinct venues, guests and sessions, ignoring Cancelled sessions', () => {
    const summary = computeEventSummary(
      {
        sessions: [
          session(),
          session({
            startDate: '2026-12-13T00:00:00.000Z',
            endDate: '2026-12-13T00:00:00.000Z',
            venue: 'Poolside',
            pax: 120,
          }),
          session({
            startDate: '2026-12-14T00:00:00.000Z',
            endDate: '2026-12-14T00:00:00.000Z',
            venue: 'Full Banquet',
            pax: 450,
          }),
          session({ venue: 'Lawn', pax: 999, sessionStatus: SessionStatus.Cancelled }),
        ],
      },
      false
    );

    expect(summary).toEqual({
      dates: '12 – 14 Dec 2026',
      venues: 'Lawn · Poolside · Full Banquet',
      guests: 820,
      sessions: 3,
      grandTotal: null,
    });
  });

  it('shows "—" for an Event with no active sessions', () => {
    const summary = computeEventSummary({ sessions: [] }, true);

    expect(summary.dates).toBe('—');
    expect(summary.venues).toBe('—');
    expect(summary.guests).toBe(0);
    expect(summary.grandTotal).toBe(0);
  });

  it('computes the Grand Total like GET /quotation-summary — example 3 is 9,75,412', () => {
    expect(computeEventSummary(EXAMPLE_3_EVENT, true).grandTotal).toBe(975412);
  });

  it('adds the extras and every manual line item, and GST on food at the stored rate', () => {
    const summary = computeEventSummary(
      {
        sessions: [session({ venueCost: 1000, items: [{ type: ItemType.Meal, pax: 10, costPerPlate: 100 }] })],
        accommodation: { finalAmount: 2000 },
        extras: { decoration: 300, photographer: 0, bhatji: 0 },
        extraLineItems: [{ amount: 50 }],
        foodGstRatePercent: 18,
      },
      true
    );

    // 1000 + 1000 × 1.18 + 2000 × 1.05 + 300 + 50 = 4630.
    expect(summary.grandTotal).toBe(4630);
  });
});
