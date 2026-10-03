import { describe, expect, it } from 'vitest';
import { formatFoodCostLine } from '../../src/components/ui/food-cost-line';
import { formatNumberedMenuItem } from '../../src/utils/menu-item-numbering';

describe('formatFoodCostLine (R3)', () => {
  it('multiplies pax by the cost per plate', () => {
    expect(formatFoodCostLine({ pax: 500, limitedSeating: false, costPerPlate: 450 })).toEqual({
      calculation: '500 pax × ₹ 450 =',
      total: '₹ 2,25,000',
    });
  });

  it('bills limited seating once, as the quotation does', () => {
    expect(formatFoodCostLine({ pax: 500, limitedSeating: true, costPerPlate: 450 })).toEqual({
      calculation: 'L.S. (500 pax) × ₹ 450 =',
      total: '₹ 450',
    });
  });

  it('rounds the total to the paisa, like the quotation', () => {
    expect(formatFoodCostLine({ pax: 3, limitedSeating: false, costPerPlate: 33.335 }).total).toBe('₹ 100.01');
  });

  it('shows a zero total for an empty row', () => {
    expect(formatFoodCostLine({ pax: 0, limitedSeating: false, costPerPlate: 0 })).toEqual({
      calculation: '0 pax × ₹ 0 =',
      total: '₹ 0',
    });
  });
});

describe('formatNumberedMenuItem (R1)', () => {
  it('prefixes the 1-based position', () => {
    expect(['Tea', 'Coffee'].map(formatNumberedMenuItem)).toEqual(['1. Tea', '2. Coffee']);
  });
});
