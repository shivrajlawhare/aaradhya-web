// Mirrors aaradhya-api's src/services/accommodation.ts exactly. Step 3 of
// the wizard has to compute and display these totals itself — there's no
// Event yet to ask the server for them (SRS FR-EVT-8) — so the formulas and
// rounding here must match the backend's precisely, or a wizard-entered
// Accommodation would print different totals than the Quotation later
// computes from the same inputs.
//
// DEV-07 (UI Redesign decision D2, verified against example_quatation_3.pdf):
// a room line is tariff × rooms × nights with **no GST** ("Total Taxable
// Amount"); Total Charges sums them; a whole-percent Discount comes off;
// and the Total Cost Summary adds 5% GST once, on the Final Amount:
//   78400 + 15200 + 24000 + 0 = 117600 → 10% = 11760 → 105840 → GST 5292
//   → 111132.

// Accommodation's GST rate, applied to the Final Amount in the Total Cost
// Summary (aaradhya-api ACCOMMODATION_GST_RATE_PERCENT).
export const ACCOMMODATION_GST_RATE_PERCENT = 5;

// Rounds to whole paise/cents, matching aaradhya-api's utils/currency.ts.
// Exported — total-cost-summary.ts needs the exact same rounding for its
// Food Cost/Grand Total math.
export const roundToCurrency = (amount: number): number => Math.round(amount * 100) / 100;

export interface WizardRoomLineInput {
  occupancy: number;
  tariff: number;
  noOfRooms: number;
}

// tariff × no_of_rooms × total_nights, no GST. totalNights is the caller's
// to supply — before check-in/check-out are both set, callers fall back to
// 1 (the backend's identical fallback) so a line still shows a provisional
// amount. A no_of_rooms of 0 (e.g. the Extra Beds default) computes to 0.
export const computeRoomLineTaxable = (
  { tariff, noOfRooms }: Pick<WizardRoomLineInput, 'tariff' | 'noOfRooms'>,
  totalNights: number
): number => roundToCurrency(tariff * noOfRooms * totalNights);

// occupancy is a room type's per-room capacity, so a line contributes
// occupancy × no_of_rooms. Not multiplied by nights — headcount, unlike
// cost, doesn't scale with the stay.
export const computeTotalOccupancy = (roomLines: WizardRoomLineInput[]): number =>
  roomLines.reduce((total, line) => total + line.occupancy * line.noOfRooms, 0);

// Σ each line's taxable amount.
export const computeTotalCharges = (roomLines: WizardRoomLineInput[], totalNights: number): number =>
  roundToCurrency(roomLines.reduce((total, line) => total + computeRoomLineTaxable(line, totalNights), 0));

// A whole-percent discount (0–100, D3) off Total Charges, rounded to the
// rupee as the quotation prints it.
export const computeDiscount = (totalCharges: number, discountPercent: number): number =>
  Math.round((totalCharges * discountPercent) / 100);

export const computeFinalAmount = (totalCharges: number, discountAmount: number): number =>
  roundToCurrency(totalCharges - discountAmount);

export interface AccommodationSummaryAmounts {
  taxable: number;
  gst: number;
  total: number;
}

// The Total Cost Summary's Accommodation row: the Final Amount, its 5% GST,
// and their sum (aaradhya-api computeTotalCostSummary).
export const computeAccommodationSummaryAmounts = (finalAmount: number): AccommodationSummaryAmounts => {
  const taxable = roundToCurrency(finalAmount);
  const gst = roundToCurrency((taxable * ACCOMMODATION_GST_RATE_PERCENT) / 100);
  return { taxable, gst, total: roundToCurrency(taxable + gst) };
};

// Whole-number 0–100, the Discount (%) field's rule (D3).
export const isValidDiscountPercent = (value: number): boolean => Number.isInteger(value) && value >= 0 && value <= 100;

// The Discount (%) field's raw text → its number, or null when invalid. An
// empty field reads as 0 (no discount), never an error.
export const parseDiscountPercent = (raw: string): number | null => {
  const value = raw.trim() === '' ? 0 : Number(raw);
  return isValidDiscountPercent(value) ? value : null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Nights stayed (check-out − check-in), clamped to a minimum of 1 —
// STORY-070's fix, mirroring aaradhya-api's computeTotalNights: a hotel stay
// is billed by nights, not inclusive calendar days. Takes only the
// 'YYYY-MM-DD' date portion — a guest's clock time doesn't shift the night
// count. Returns null when either date is missing or unparseable, and
// doesn't guard checkOut < checkIn (the step's own validation does).
export const computeTotalNights = (checkInDate: string, checkOutDate: string): number | null => {
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
