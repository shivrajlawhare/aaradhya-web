import { ItemType } from '../../contract';
import {
  type AccommodationSummaryAmounts,
  computeAccommodationSummaryAmounts,
  roundToCurrency,
} from '../../utils/accommodation-calculations';
import { toDateInputValue } from '../event-detail/date-input';

// The Quotation's figures, kept out of quotation-document.tsx so they can be
// unit-tested on their own (DEV-09: example_quatation_3.pdf reproduced to
// the rupee). Mirrors aaradhya-api's services/quotation.ts and the wizard's
// utils/total-cost-summary.ts — the three must round identically.

interface QuotationItemInput {
  type: ItemType;
  pax?: number | null;
  costPerPlate?: number | null;
  limitedSeating?: boolean | null;
}

interface QuotationSessionInput<TItem extends QuotationItemInput> {
  startDate: string;
  venueCost?: number;
  items: TItem[];
}

export interface QuotationDateGroup<TSession, TItem> {
  date: string;
  sessions: TSession[];
  items: TItem[];
}

// One group per distinct Session start date, in date order (STORY-071). Two
// Sessions on the same date pool into one group — their Items in Session
// entry order, then each Session's own item order (example_quatation_2.pdf's
// Halad + Engagement).
export const groupSessionsByDate = <TItem extends QuotationItemInput, TSession extends QuotationSessionInput<TItem>>(
  sessions: TSession[]
): QuotationDateGroup<TSession, TItem>[] => {
  const groups: QuotationDateGroup<TSession, TItem>[] = [];
  for (const session of sessions) {
    const date = toDateInputValue(session.startDate);
    const existing = groups.find((group) => group.date === date);
    if (existing) {
      existing.sessions.push(session);
      existing.items.push(...session.items);
    } else {
      groups.push({ date, sessions: [session], items: [...session.items] });
    }
  }
  return groups.sort((a, b) => a.date.localeCompare(b.date));
};

// FR-QUO-8: a limited-seating Meal Item is billed as pax 1 (a flat charge),
// not its headcount.
export const computeBilledPax = (item: QuotationItemInput): number => (item.limitedSeating ? 1 : (item.pax ?? 0));

// Rounded per row, like total-cost-summary.ts.
export const computeFoodItemTotalCost = (item: QuotationItemInput): number =>
  roundToCurrency(computeBilledPax(item) * (item.costPerPlate ?? 0));

export const computeFoodItemGst = (item: QuotationItemInput, foodGstRatePercent: number): number =>
  roundToCurrency(computeFoodItemTotalCost(item) * (foodGstRatePercent / 100));

export interface QuotationTotalsInput<TItem extends QuotationItemInput> {
  sessions: QuotationSessionInput<TItem>[];
  // The Accommodation block's Final Amount (Total Charges less discount).
  accommodationFinalAmount: number;
  extraLineItemAmounts: number[];
  foodGstRatePercent: number;
}

export interface QuotationTotals {
  venueTotal: number;
  foodCostTotal: number;
  foodGst: number;
  foodCostWithGst: number;
  // Taxable (the Final Amount), its 5% GST, and their sum (D2).
  accommodation: AccommodationSummaryAmounts;
  extraLineItemsTotal: number;
  grandTotal: number;
}

// The Total Cost Summary's roll-up: every venue + Food Cost with GST +
// Accommodation with GST + every manual line item. Food GST is computed on
// the summed total (not per row), so the Food Cost row always adds up.
export const computeQuotationTotals = <TItem extends QuotationItemInput>({
  sessions,
  accommodationFinalAmount,
  extraLineItemAmounts,
  foodGstRatePercent,
}: QuotationTotalsInput<TItem>): QuotationTotals => {
  const mealItems = sessions.flatMap((session) => session.items).filter((item) => item.type === ItemType.Meal);
  const venueTotal = roundToCurrency(sessions.reduce((total, session) => total + (session.venueCost ?? 0), 0));
  const foodCostTotal = roundToCurrency(mealItems.reduce((total, item) => total + computeFoodItemTotalCost(item), 0));
  const foodCostWithGst = roundToCurrency(foodCostTotal * (1 + foodGstRatePercent / 100));
  const accommodation = computeAccommodationSummaryAmounts(accommodationFinalAmount);
  const extraLineItemsTotal = roundToCurrency(extraLineItemAmounts.reduce((total, amount) => total + amount, 0));

  return {
    venueTotal,
    foodCostTotal,
    foodGst: roundToCurrency(foodCostWithGst - foodCostTotal),
    foodCostWithGst,
    accommodation,
    extraLineItemsTotal,
    grandTotal: roundToCurrency(venueTotal + foodCostWithGst + accommodation.total + extraLineItemsTotal),
  };
};
