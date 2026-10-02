import { describe, expect, it } from 'vitest';
import { ItemType } from '../../src/contract';
import {
  computeFoodItemGst,
  computeFoodItemTotalCost,
  computeQuotationTotals,
  groupSessionsByDate,
} from '../../src/pages/quotation-preview/quotation-calculations';
import { EXAMPLE_3_EVENT } from '../support/example-quotation-3';

const extraLineItemAmounts = EXAMPLE_3_EVENT.extraLineItems.map((item) => item.amount);

describe('computeQuotationTotals', () => {
  it('reproduces example_quatation_3.pdf to the rupee, through Grand Total 9,75,412', () => {
    expect(
      computeQuotationTotals({
        sessions: EXAMPLE_3_EVENT.sessions,
        accommodationFinalAmount: EXAMPLE_3_EVENT.accommodation.finalAmount,
        extraLineItemAmounts,
        foodGstRatePercent: 5,
      })
    ).toEqual({
      venueTotal: 180000,
      foodCostTotal: 473600,
      foodGst: 23680,
      foodCostWithGst: 497280,
      accommodation: { taxable: 105840, gst: 5292, total: 111132 },
      extraLineItemsTotal: 187000,
      grandTotal: 975412,
    });
  });

  it('adds no accommodation GST when there is no accommodation', () => {
    const totals = computeQuotationTotals({
      sessions: [],
      accommodationFinalAmount: 0,
      extraLineItemAmounts: [],
      foodGstRatePercent: 5,
    });

    expect(totals.accommodation).toEqual({ taxable: 0, gst: 0, total: 0 });
    expect(totals.grandTotal).toBe(0);
  });
});

describe('food item cost', () => {
  it('bills a limited-seating item at pax 1 (FR-QUO-8), with GST at the given rate', () => {
    const item = { type: ItemType.Meal, pax: 120, costPerPlate: 18000, limitedSeating: true };

    expect(computeFoodItemTotalCost(item)).toBe(18000);
    expect(computeFoodItemGst(item, 5)).toBe(900);
  });
});

describe('groupSessionsByDate', () => {
  it('groups by start date in date order, pooling Sessions that share a date', () => {
    const groups = groupSessionsByDate([
      { startDate: '2027-05-15T00:00:00.000Z', items: [{ type: ItemType.Meal }] },
      { startDate: '2027-05-14T00:00:00.000Z', items: [] },
      { startDate: '2027-05-15T00:00:00.000Z', items: [{ type: ItemType.Event }] },
    ]);

    expect(groups.map((group) => [group.date, group.sessions.length, group.items.length])).toEqual([
      ['2027-05-14', 1, 0],
      ['2027-05-15', 2, 2],
    ]);
  });
});
