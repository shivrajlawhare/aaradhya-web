import { ItemType } from '../contract';
import type { WizardSessionRow } from '../pages/event-creation/event-details-step';
import type { WizardDateEntry, WizardFoodItem } from '../pages/event-creation/sessions-items-step';
import { computeTotalCharges, roundToCurrency, type WizardRoomLineInput } from './accommodation-calculations';
import { formatEventDate, formatQuotationPax } from './quotation-formatting';
import { getDistinctDates } from './session-dates';

// Mirrors aaradhya-api's src/services/quotation.ts (computeTotalCostSummary)
// — Step 5 of the wizard has to compute and display the Total Cost Summary
// itself, live, before any Event exists to ask the server for it (SRS
// FR-EVT-8), verified line-by-line against both reference quotations
// (docs/example_quatations/) per SRS FR-QUO-9's own structure:
//
//   - One venue row per Session on a date (not one per date) — Sub Cost
//     Item = that Session's venue, Total Cost with GST = its venue_cost as
//     entered, no GST applied.
//   - One food row per Meal Item on that date, across every Session that
//     date has — Pax/Cost per Plate/Total Cost only, no Total Cost with GST
//     (Ceremony/Event Items never appear here at all).
//   - A single aggregate Food Cost row: Total Cost = every food row's Total
//     Cost summed across every date; Total Cost with GST = that sum ×
//     (1 + GST%). Both reference quotations' own printed numbers confirm a
//     5% default here (597150 × 1.05 = 627007.5; 391500 × 1.05 = 411075),
//     distinct from the 18% org-wide rate accommodation-calculations.ts
//     uses — FR-QUO-9's own "editable... if it varies" (SRS §4.9/A9) is
//     honored by this screen's own editable GST% field, not a fixed constant.
//   - An Accommodation row: Step 3's own computeTotalCharges, already
//     GST-inclusive, used as-is.
//   - Zero or more manually-added rows (FR-QUO-9a) — name, optional note,
//     and a plain entered amount.
//   - A Grand Total: every venue row + the one Food Cost row + Accommodation
//     + every manual row, all summed from their own Total Cost with GST —
//     verified against both reference quotations' printed Grand Totals
//     (Rs. 10,73,208 /- and Rs. 9,49,555 /-) to the rupee.

export interface SummaryVenueRow {
  id: string;
  label: string;
  amount: number;
}

export interface SummaryFoodRow {
  id: string;
  label: string;
  paxDisplay: string;
  costPerPlate: number;
  totalCost: number;
}

export interface SummaryDateBlock {
  date: string;
  dateLabel: string;
  venueRows: SummaryVenueRow[];
  foodRows: SummaryFoodRow[];
}

export interface ManualLineItem {
  id: string;
  name: string;
  note: string;
  amount: number;
}

export interface TotalCostSummaryResult {
  dateBlocks: SummaryDateBlock[];
  foodCostTotal: number;
  foodCostWithGst: number;
  accommodationTotal: number;
  manualLineItems: ManualLineItem[];
  grandTotal: number;
}

const computeFoodItemTotalCost = (item: WizardFoodItem): number => {
  const pax = item.limitedSeating ? 1 : item.pax;
  return roundToCurrency(pax * item.costPerPlate);
};

const isFoodEntry = (entry: WizardDateEntry): entry is WizardFoodItem => entry.type === ItemType.Meal;

interface ComputeWizardTotalCostSummaryInput {
  sessions: WizardSessionRow[];
  byDate: Record<string, WizardDateEntry[]>;
  roomLines: WizardRoomLineInput[];
  // Step 3's own total_days (falls back to 1 before check-in/check-out are
  // both set — same convention AccommodationStep's own totalDaysForMath
  // and aaradhya-api's identical fallback both already use), needed since
  // Accommodation's own GST-inclusive total now factors in nights stayed,
  // not just tariff × rooms (STORY-068, verified against both reference
  // quotations).
  accommodationTotalDays: number;
  gstPercent: number;
  manualLineItems: ManualLineItem[];
}

export const computeWizardTotalCostSummary = ({
  sessions,
  byDate,
  roomLines,
  accommodationTotalDays,
  gstPercent,
  manualLineItems,
}: ComputeWizardTotalCostSummaryInput): TotalCostSummaryResult => {
  const dates = getDistinctDates(sessions);

  const dateBlocks: SummaryDateBlock[] = dates.map((date) => {
    // A Session's own venue row is anchored to its startDate only, never
    // repeated across every date it spans — venue_cost is a single flat
    // booking fee for the Session as a whole (auto-filled once from the
    // Venue Master, SRS §4.2), not a nightly rate the way Accommodation's
    // tariff is, so a multi-day Session must not have its venue charged
    // once per day it covers. FR-QUO-9's "one venue row per Session on
    // that date" still holds exactly as written for the ordinary case of
    // several distinct Sessions sharing one date (each still gets its own
    // row on that shared date) — this only changes which single date a
    // Session spanning more than one day is attributed to.
    const sessionsForDate = sessions.filter((session) => session.startDate === date);
    const venueRows: SummaryVenueRow[] = sessionsForDate.map((session) => ({
      id: session.id,
      label: session.venue,
      amount: session.venueCost,
    }));

    const foodRows: SummaryFoodRow[] = (byDate[date] ?? []).filter(isFoodEntry).map((item) => ({
      id: item.id,
      label: item.mealName || '(blank food row)',
      paxDisplay: formatQuotationPax(item.pax, item.limitedSeating),
      costPerPlate: item.costPerPlate,
      totalCost: computeFoodItemTotalCost(item),
    }));

    return { date, dateLabel: formatEventDate(date), venueRows, foodRows };
  });

  const foodCostTotal = roundToCurrency(
    dateBlocks.reduce((total, block) => total + block.foodRows.reduce((sum, row) => sum + row.totalCost, 0), 0),
  );
  const foodCostWithGst = roundToCurrency(foodCostTotal * (1 + gstPercent / 100));
  const accommodationTotal = computeTotalCharges(roomLines, accommodationTotalDays);
  const manualTotal = roundToCurrency(manualLineItems.reduce((total, item) => total + item.amount, 0));
  const venueTotal = roundToCurrency(
    dateBlocks.reduce((total, block) => total + block.venueRows.reduce((sum, row) => sum + row.amount, 0), 0),
  );
  const grandTotal = roundToCurrency(venueTotal + foodCostWithGst + accommodationTotal + manualTotal);

  return { dateBlocks, foodCostTotal, foodCostWithGst, accommodationTotal, manualLineItems, grandTotal };
};
