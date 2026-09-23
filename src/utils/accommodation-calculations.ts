// Mirrors aaradhya-api's src/services/accommodation.ts exactly. Step 3 of
// the wizard has to compute and display these totals itself — there's no
// Event yet to ask the server for them (SRS FR-EVT-8, same reasoning
// event-details-step.tsx's own client-side Duration formatting documents)
// — so the formulas here must match the backend's precisely or a wizard-
// entered Accommodation would print different totals here than the
// Quotation eventually computes from the same inputs.

// Mirrors aaradhya-api's own ACCOMMODATION_GST_RATE_PERCENT (services/
// accommodation.ts) — verified against both reference quotations
// (docs/example_quatations/, STORY-068): a room line's own printed "Total
// including GST" is tariff × no_of_rooms × total_days × 1.05 exactly (e.g.
// Deluxe: 2500 × 14 rooms × 2 nights × 1.05 = 73,500, reproduced
// identically in both PDFs for every room type). This supersedes
// STORY-066's original 18%-flat, no-total_days formula, which predates
// having the reference quotations to verify against.
const GST_RATE_PERCENT = 5;

// Rounds to whole paise/cents, matching aaradhya-api's utils/currency.ts.
// Exported — STORY-068's own total-cost-summary.ts needs the exact same
// rounding for its Food Cost/Grand Total math, the same "extract once a
// second real caller needs it" reasoning already applied elsewhere.
export const roundToCurrency = (amount: number): number => Math.round(amount * 100) / 100;

export interface WizardRoomLineInput {
  occupancy: number;
  tariff: number;
  noOfRooms: number;
}

// tariff × no_of_rooms × total_days, GST-inclusive at the flat rate above.
// totalDays is the caller's job to supply (falls back to 1 before
// check-in/check-out are both set — see AccommodationStep's own
// totalDaysForMath). A no_of_rooms of 0 (the Extra Beds default row, left
// untouched) simply computes to 0, not an error — same edge case the
// backend's own version decided.
export const computeRoomLineTotalInclGst = (
  { tariff, noOfRooms }: Pick<WizardRoomLineInput, 'tariff' | 'noOfRooms'>,
  totalDays: number
): number => roundToCurrency(tariff * noOfRooms * totalDays * (1 + GST_RATE_PERCENT / 100));

// occupancy is a room type's per-room capacity, so a line contributes
// occupancy × no_of_rooms — same reasoning the backend's own version
// documents. Not multiplied by total_days — headcount, unlike cost,
// doesn't scale with nights stayed.
export const computeTotalOccupancy = (roomLines: WizardRoomLineInput[]): number =>
  roomLines.reduce((total, line) => total + line.occupancy * line.noOfRooms, 0);

export const computeTotalCharges = (roomLines: WizardRoomLineInput[], totalDays: number): number =>
  roundToCurrency(roomLines.reduce((total, line) => total + computeRoomLineTotalInclGst(line, totalDays), 0));

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Nights stayed (check-out − check-in), clamped to a minimum of 1 — STORY-070's
// own fix, mirroring aaradhya-api's services/accommodation.ts computeTotalDays.
// The previous "+1" inclusive-day formula (matching the backend's shared,
// Session-duration-only computeInclusiveDayCount) silently returned 3 for a
// check-in 10-12-2026 → check-out 12-12-2026 pair that both reference
// quotations (docs/example_quatations, aaradhya-api repo) print as "Total
// Days: 2" — a hotel stay is billed by nights, not inclusive calendar days,
// unlike a Session's own multi-day duration (which genuinely wants "+1").
// Deliberately takes only the 'YYYY-MM-DD' date portion, not check-in/
// check-out time — "nights stayed" is a calendar-day count a guest's exact
// arrival/departure clock time shouldn't shift. Returns null when either
// date is missing or unparseable, and does not guard checkOut < checkIn (an
// invalid range) — that's this step's own UI-level validation, not this
// pure function's job.
export const computeTotalDays = (checkInDate: string, checkOutDate: string): number | null => {
  if (!checkInDate || !checkOutDate) {
    return null;
  }
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  return Math.max(Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY), 1);
};
