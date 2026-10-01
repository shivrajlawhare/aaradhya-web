import { describe, expect, it } from 'vitest';
import {
  computeAccommodationSummaryAmounts,
  computeDiscount,
  computeFinalAmount,
  computeRoomLineTaxable,
  computeTotalCharges,
  computeTotalNights,
  computeTotalOccupancy,
  isValidDiscountPercent,
  parseDiscountPercent,
} from '../../src/utils/accommodation-calculations';

// example_quatation_3.pdf (DEV-07): 13/05/2027 → 15/05/2027 = 2 nights.
const EXAMPLE_3_LINES = [
  { occupancy: 2, tariff: 2800, noOfRooms: 14 }, // Delux
  { occupancy: 3, tariff: 3800, noOfRooms: 2 }, // Executive
  { occupancy: 6, tariff: 6000, noOfRooms: 2 }, // Family Room
  { occupancy: 0, tariff: 700, noOfRooms: 0 }, // Extra Beds
];

describe('computeRoomLineTaxable', () => {
  it('is tariff × rooms × nights with no GST — example 3’s printed Total Taxable Amounts', () => {
    expect(computeRoomLineTaxable({ tariff: 2800, noOfRooms: 14 }, 2)).toBe(78400);
    expect(computeRoomLineTaxable({ tariff: 3800, noOfRooms: 2 }, 2)).toBe(15200);
    expect(computeRoomLineTaxable({ tariff: 6000, noOfRooms: 2 }, 2)).toBe(24000);
    expect(computeRoomLineTaxable({ tariff: 700, noOfRooms: 0 }, 2)).toBe(0);
  });

  it('rounds to the nearest paisa', () => {
    expect(computeRoomLineTaxable({ tariff: 999.995, noOfRooms: 1 }, 1)).toBe(1000);
  });
});

describe('computeTotalOccupancy', () => {
  it('sums occupancy × rooms across lines — example 3 prints Total Occ. 46', () => {
    expect(computeTotalOccupancy(EXAMPLE_3_LINES)).toBe(46);
  });
});

describe('computeTotalCharges', () => {
  it('is 0 with no room lines', () => {
    expect(computeTotalCharges([], 2)).toBe(0);
  });

  it('sums the taxable amounts — 78400 + 15200 + 24000 + 0 = 1,17,600', () => {
    expect(computeTotalCharges(EXAMPLE_3_LINES, 2)).toBe(117600);
  });
});

describe('discount and Final Amount (D3)', () => {
  it('reproduces example 3: 10% of 1,17,600 = 11,760 → Final Amount 1,05,840', () => {
    const discount = computeDiscount(117600, 10);

    expect(discount).toBe(11760);
    expect(computeFinalAmount(117600, discount)).toBe(105840);
  });

  it('is no discount at 0% and the whole amount at 100%', () => {
    expect(computeDiscount(117600, 0)).toBe(0);
    expect(computeDiscount(117600, 100)).toBe(117600);
  });

  it('rounds the discount to the rupee, as the server does', () => {
    // 7% of 1001 = 70.07 → 70.
    expect(computeDiscount(1001, 7)).toBe(70);
  });
});

describe('computeAccommodationSummaryAmounts', () => {
  it('adds 5% GST on the Final Amount: 1,05,840 → GST 5,292 → ₹ 1,11,132 (example 3)', () => {
    expect(computeAccommodationSummaryAmounts(105840)).toEqual({ taxable: 105840, gst: 5292, total: 111132 });
  });

  it('rolls example 3 end to end, from room lines to the summary row', () => {
    const totalCharges = computeTotalCharges(EXAMPLE_3_LINES, 2);
    const finalAmount = computeFinalAmount(totalCharges, computeDiscount(totalCharges, 10));

    expect(computeAccommodationSummaryAmounts(finalAmount).total).toBe(111132);
  });
});

describe('Discount (%) validation', () => {
  it('accepts whole numbers 0–100 only', () => {
    expect(isValidDiscountPercent(0)).toBe(true);
    expect(isValidDiscountPercent(100)).toBe(true);
    expect(isValidDiscountPercent(10.5)).toBe(false);
    expect(isValidDiscountPercent(-1)).toBe(false);
    expect(isValidDiscountPercent(101)).toBe(false);
    expect(isValidDiscountPercent(Number.NaN)).toBe(false);
  });

  it('parses the raw field text, reading an empty field as 0', () => {
    expect(parseDiscountPercent('')).toBe(0);
    expect(parseDiscountPercent('10')).toBe(10);
    expect(parseDiscountPercent('10.5')).toBeNull();
    expect(parseDiscountPercent('150')).toBeNull();
  });
});

describe('computeTotalNights', () => {
  // STORY-070 — example_quatation_1.pdf's own check-in/check-out prints 2.
  it('counts nights stayed (check-out − check-in), not inclusive calendar days', () => {
    expect(computeTotalNights('2026-12-10', '2026-12-12')).toBe(2);
    expect(computeTotalNights('2027-05-13', '2027-05-15')).toBe(2);
  });

  it('is 1 for a same-day stay, not 0', () => {
    expect(computeTotalNights('2026-12-10', '2026-12-10')).toBe(1);
  });

  it('returns null when either date is missing', () => {
    expect(computeTotalNights('', '2026-12-12')).toBeNull();
    expect(computeTotalNights('2026-12-10', '')).toBeNull();
  });
});
