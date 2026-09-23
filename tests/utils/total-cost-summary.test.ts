import { describe, expect, it } from 'vitest';
import { ItemType } from '../../src/contract';
import { emptySetup, type WizardSessionRow } from '../../src/pages/event-creation/event-details-step';
import type { WizardDateEntry } from '../../src/pages/event-creation/sessions-items-step';
import { computeWizardTotalCostSummary } from '../../src/utils/total-cost-summary';

const session = (overrides: Partial<WizardSessionRow> = {}): WizardSessionRow => ({
  id: 's1',
  sessionType: 'Wedding',
  venue: 'Poolside',
  venueCost: 60000,
  pax: 200,
  startDate: '2026-12-10',
  endDate: '2026-12-10',
  startTime: '',
  endTime: '',
  setup: emptySetup,
  ...overrides,
});

const foodItem = (overrides: Partial<Extract<WizardDateEntry, { type: ItemType.Meal }>> = {}) => ({
  id: 'f1',
  type: ItemType.Meal as const,
  mealName: 'Lunch',
  startTime: '',
  endTime: '',
  pax: 30,
  limitedSeating: false,
  costPerPlate: 275,
  menuItems: [],
  ...overrides,
});

describe('computeWizardTotalCostSummary', () => {
  // Reproduces docs/example_quatations/example_quatation_1.pdf's own Total
  // Cost Summary exactly (SRS FR-QUO-9's binding structure) — one date
  // block per Session date, Food Cost aggregated once at 5% GST, Grand
  // Total = every venue row + Food Cost (incl. GST) + Accommodation + every
  // manual row.
  it('matches example_quatation_1.pdf’s exact printed numbers', () => {
    const sessions: WizardSessionRow[] = [
      session({
        id: 's1',
        sessionType: 'Engagement',
        venue: 'Poolside',
        venueCost: 60000,
        startDate: '2026-12-10',
        endDate: '2026-12-10',
      }),
      session({
        id: 's2',
        sessionType: 'Wedding',
        venue: 'Full Banquet',
        venueCost: 120000,
        startDate: '2026-12-11',
        endDate: '2026-12-11',
      }),
    ];
    const byDate: Record<string, WizardDateEntry[]> = {
      '2026-12-10': [
        foodItem({ id: 'f1', mealName: 'HiTea', pax: 30, costPerPlate: 275 }),
        foodItem({ id: 'f2', mealName: 'Chaat Counter', limitedSeating: true, pax: 30, costPerPlate: 12000 }),
        foodItem({ id: 'f3', mealName: 'Chai Tapri', limitedSeating: true, pax: 30, costPerPlate: 5000 }),
        foodItem({ id: 'f4', mealName: 'Drinks', pax: 30, costPerPlate: 80 }),
        foodItem({ id: 'f5', mealName: 'Cake', limitedSeating: true, pax: 30, costPerPlate: 3000 }),
        foodItem({ id: 'f6', mealName: 'Dinner', pax: 30, costPerPlate: 900 }),
      ],
      '2026-12-11': [
        foodItem({ id: 'f7', mealName: 'Breakfast', pax: 50, costPerPlate: 350 }),
        foodItem({ id: 'f8', mealName: 'Starter', pax: 300, costPerPlate: 180 }),
        foodItem({ id: 'f9', mealName: 'Chaat Counter', limitedSeating: true, pax: 300, costPerPlate: 45000 }),
        foodItem({ id: 'f10', mealName: 'Welcome Drink', pax: 300, costPerPlate: 210 }),
        foodItem({ id: 'f11', mealName: 'Lunch', pax: 300, costPerPlate: 1200 }),
      ],
    };
    const roomLines = [
      { occupancy: 2, tariff: 2500, noOfRooms: 14 },
      { occupancy: 3, tariff: 3500, noOfRooms: 2 },
      { occupancy: 6, tariff: 5000, noOfRooms: 2 },
      { occupancy: 0, tariff: 700, noOfRooms: 0 },
    ];

    const summary = computeWizardTotalCostSummary({
      sessions,
      byDate,
      roomLines,
      accommodationTotalDays: 2,
      gstPercent: 5,
      manualLineItems: [
        {
          id: 'm1',
          name: 'Decoration',
          note: 'poolside engg sangeet + Wedding(Vidhi mandap with saptapadi)',
          amount: 150000,
        },
        { id: 'm2', name: 'Bhatji', note: 'wedding', amount: 7000 },
      ],
    });

    expect(summary.foodCostTotal).toBe(597150);
    expect(summary.foodCostWithGst).toBe(627007.5);
    expect(summary.accommodationTotal).toBe(109200);
    expect(summary.dateBlocks).toHaveLength(2);
    expect(summary.dateBlocks[0]!.venueRows).toEqual([{ id: 's1', label: 'Poolside', amount: 60000 }]);
    expect(summary.dateBlocks[1]!.venueRows).toEqual([{ id: 's2', label: 'Full Banquet', amount: 120000 }]);
    expect(summary.dateBlocks[0]!.foodRows).toHaveLength(6);
    expect(summary.dateBlocks[0]!.foodRows[1]).toMatchObject({
      label: 'Chaat Counter',
      paxDisplay: 'L.S. (30pax)',
      totalCost: 12000,
    });
    // Grand Total, unrounded to whole rupees (the PDF's own "Rs. 10,73,208
    // /-" is the display-time rounding of this exact figure, per this
    // story's own AC).
    expect(summary.grandTotal).toBe(60000 + 120000 + 627007.5 + 109200 + 150000 + 7000);
    expect(Math.round(summary.grandTotal)).toBe(1073208);
  });

  it('supports two same-date Sessions, each contributing its own venue row', () => {
    const sessions: WizardSessionRow[] = [
      session({
        id: 's1',
        sessionType: 'Halad',
        venue: 'Half Banquet',
        venueCost: 60000,
        startDate: '2027-02-26',
        endDate: '2027-02-26',
      }),
      session({
        id: 's2',
        sessionType: 'Engagement',
        venue: 'Poolside',
        venueCost: 60000,
        startDate: '2027-02-26',
        endDate: '2027-02-26',
      }),
    ];

    const summary = computeWizardTotalCostSummary({
      sessions,
      byDate: {},
      roomLines: [],
      accommodationTotalDays: 1,
      gstPercent: 5,
      manualLineItems: [],
    });

    expect(summary.dateBlocks).toHaveLength(1);
    expect(summary.dateBlocks[0]!.venueRows).toEqual([
      { id: 's1', label: 'Half Banquet', amount: 60000 },
      { id: 's2', label: 'Poolside', amount: 60000 },
    ]);
  });

  it('charges a multi-day Session’s venue cost once, not once per date it spans', () => {
    const sessions: WizardSessionRow[] = [
      session({ id: 's1', venue: 'Poolside', venueCost: 60000, startDate: '2026-09-12', endDate: '2026-09-13' }),
    ];

    const summary = computeWizardTotalCostSummary({
      sessions,
      byDate: {},
      roomLines: [],
      accommodationTotalDays: 1,
      gstPercent: 5,
      manualLineItems: [],
    });

    expect(summary.dateBlocks).toHaveLength(2);
    // Anchored to the Session's own startDate only — not appended to the
    // second day's block as well, which would double the venue charge.
    expect(summary.dateBlocks[0]!.venueRows).toEqual([{ id: 's1', label: 'Poolside', amount: 60000 }]);
    expect(summary.dateBlocks[1]!.venueRows).toEqual([]);
    expect(summary.grandTotal).toBe(60000);
  });

  it('excludes Ceremony (Event Item) entries from the Food Cost rollup entirely', () => {
    const sessions: WizardSessionRow[] = [session()];
    const byDate: Record<string, WizardDateEntry[]> = {
      '2026-12-10': [{ id: 'c1', type: ItemType.Event, eventName: 'Muhurta', startTime: '', endTime: '' }],
    };

    const summary = computeWizardTotalCostSummary({
      sessions,
      byDate,
      roomLines: [],
      accommodationTotalDays: 1,
      gstPercent: 5,
      manualLineItems: [],
    });

    expect(summary.dateBlocks[0]!.foodRows).toEqual([]);
    expect(summary.foodCostTotal).toBe(0);
  });

  it('sums manual line items into the Grand Total, alongside venue/food/accommodation', () => {
    const sessions: WizardSessionRow[] = [session({ venueCost: 0 })];

    const summary = computeWizardTotalCostSummary({
      sessions,
      byDate: {},
      roomLines: [],
      accommodationTotalDays: 1,
      gstPercent: 5,
      manualLineItems: [
        { id: 'm1', name: 'Decoration', note: '', amount: 15000 },
        { id: 'm2', name: 'Photographer', note: '', amount: 25000 },
      ],
    });

    expect(summary.grandTotal).toBe(40000);
  });

  it('recomputes Food Cost with GST when gstPercent changes, with no other input changing', () => {
    const sessions: WizardSessionRow[] = [session({ venueCost: 0 })];
    const byDate: Record<string, WizardDateEntry[]> = {
      '2026-12-10': [foodItem({ pax: 10, costPerPlate: 100 })],
    };

    const at5 = computeWizardTotalCostSummary({
      sessions,
      byDate,
      roomLines: [],
      accommodationTotalDays: 1,
      gstPercent: 5,
      manualLineItems: [],
    });
    const at18 = computeWizardTotalCostSummary({
      sessions,
      byDate,
      roomLines: [],
      accommodationTotalDays: 1,
      gstPercent: 18,
      manualLineItems: [],
    });

    expect(at5.foodCostTotal).toBe(1000);
    expect(at5.foodCostWithGst).toBe(1050);
    expect(at18.foodCostWithGst).toBe(1180);
  });

  it('returns an all-zero, empty summary for no Sessions/data, not an error', () => {
    const summary = computeWizardTotalCostSummary({
      sessions: [],
      byDate: {},
      roomLines: [],
      accommodationTotalDays: 1,
      gstPercent: 5,
      manualLineItems: [],
    });

    expect(summary).toEqual({
      dateBlocks: [],
      foodCostTotal: 0,
      foodCostWithGst: 0,
      accommodationTotal: 0,
      manualLineItems: [],
      grandTotal: 0,
    });
  });
});
