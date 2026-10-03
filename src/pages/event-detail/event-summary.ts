import { type ItemType, SessionStatus } from '../../contract';
import { computeQuotationTotals } from '../quotation-preview/quotation-calculations';
import { toDateInputValue } from './date-input';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface SummarySessionItem {
  type: ItemType;
  pax?: number | null;
  costPerPlate?: number | null;
  limitedSeating?: boolean | null;
}

interface SummarySession {
  startDate: string;
  endDate: string;
  venue: string;
  venueCost?: number;
  sessionStatus: SessionStatus;
  items?: SummarySessionItem[];
}

interface SummaryEvent {
  sessions: SummarySession[];
  accommodation?: { finalAmount?: number };
  extraLineItems?: { amount: number }[];
  foodGstRatePercent?: number;
}

export interface EventSummary {
  dates: string;
  venues: string;
  sessions: number;
  // Event Manager only — absent when the money fields aren't visible.
  grandTotal: number | null;
}

const FOOD_GST_RATE_PERCENT_DEFAULT = 5;

const parseDate = (date: string): { day: number; month: number; year: number } => {
  const [year, month, day] = toDateInputValue(date).split('-').map(Number);
  return { day: day ?? 0, month: month ?? 1, year: year ?? 0 };
};

// The Summary Strip's date range (Figma Summary Strip): "12 – 14 Dec 2026"
// within a month, "28 Feb – 2 Mar 2027" across months, "30 Dec 2026 –
// 2 Jan 2027" across years, "12 Dec 2026" for a single day.
export const formatDateRange = (start: string, end: string): string => {
  const from = parseDate(start);
  const to = parseDate(end);
  const fromMonth = MONTHS[from.month - 1];
  const toMonth = MONTHS[to.month - 1];
  if (from.year !== to.year) {
    return `${from.day} ${fromMonth} ${from.year} – ${to.day} ${toMonth} ${to.year}`;
  }
  if (from.month !== to.month) {
    return `${from.day} ${fromMonth} – ${to.day} ${toMonth} ${to.year}`;
  }
  if (from.day !== to.day) {
    return `${from.day} – ${to.day} ${toMonth} ${to.year}`;
  }
  return `${to.day} ${toMonth} ${to.year}`;
};

// The Event Detail Summary Strip (D9), computed from the loaded Event — no
// extra request. Cancelled Sessions don't count, as on the Quotation. The
// Grand Total mirrors GET /events/:id/quotation-summary: venues + food with
// GST + accommodation with GST + every extra line item (the only extras
// since v2.2.0, DEV-20).
export const computeEventSummary = (event: SummaryEvent, canSeeMoney: boolean): EventSummary => {
  const activeSessions = event.sessions.filter((session) => session.sessionStatus === SessionStatus.Active);
  const dates = activeSessions.flatMap((session) => [
    toDateInputValue(session.startDate),
    toDateInputValue(session.endDate),
  ]);
  const sortedDates = [...dates].sort();
  const firstDate = sortedDates[0];
  const lastDate = sortedDates[sortedDates.length - 1];
  const venues = [...new Set(activeSessions.map((session) => session.venue).filter(Boolean))];

  let grandTotal: number | null = null;
  if (canSeeMoney) {
    grandTotal = computeQuotationTotals({
      sessions: activeSessions.map((session) => ({ ...session, items: session.items ?? [] })),
      accommodationFinalAmount: event.accommodation?.finalAmount ?? 0,
      extraLineItemAmounts: (event.extraLineItems ?? []).map((item) => item.amount),
      foodGstRatePercent: event.foodGstRatePercent ?? FOOD_GST_RATE_PERCENT_DEFAULT,
    }).grandTotal;
  }

  return {
    dates: firstDate && lastDate ? formatDateRange(firstDate, lastDate) : '—',
    venues: venues.length > 0 ? venues.join(' · ') : '—',
    sessions: activeSessions.length,
    grandTotal,
  };
};
