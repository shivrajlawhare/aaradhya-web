// Mirrors aaradhya-api's src/services/accommodation.ts exactly. Step 3 of
// the wizard has to compute and display these totals itself — there's no
// Event yet to ask the server for them (SRS FR-EVT-8, same reasoning
// event-details-step.tsx's own client-side Duration formatting documents)
// — so the formulas here must match the backend's precisely or a wizard-
// entered Accommodation would print different totals here than the
// Quotation eventually computes from the same inputs.

// Mirrors aaradhya-api's config.gstRatePercent default — same "illustrative
// placeholder until confirmed" reasoning session-form-options.ts already
// documents for VENUE_COST_LOOKUP. There's no public endpoint exposing the
// org's actual configured rate to the frontend.
const GST_RATE_PERCENT = 18;

// Rounds to whole paise/cents, matching aaradhya-api's utils/currency.ts.
const roundToCurrency = (amount: number): number => Math.round(amount * 100) / 100;

export interface WizardRoomLineInput {
  occupancy: number;
  tariff: number;
  noOfRooms: number;
}

// tariff × no_of_rooms, GST-inclusive at the single flat rate above. A
// no_of_rooms of 0 (the Extra Beds default row, left untouched) simply
// computes to 0, not an error — same edge case the backend's own version
// decided.
export const computeRoomLineTotalInclGst = ({ tariff, noOfRooms }: Pick<WizardRoomLineInput, 'tariff' | 'noOfRooms'>): number =>
  roundToCurrency(tariff * noOfRooms * (1 + GST_RATE_PERCENT / 100));

// occupancy is a room type's per-room capacity, so a line contributes
// occupancy × no_of_rooms — same reasoning the backend's own version
// documents.
export const computeTotalOccupancy = (roomLines: WizardRoomLineInput[]): number =>
  roomLines.reduce((total, line) => total + line.occupancy * line.noOfRooms, 0);

export const computeTotalCharges = (roomLines: WizardRoomLineInput[]): number =>
  roundToCurrency(roomLines.reduce((total, line) => total + computeRoomLineTotalInclGst(line), 0));

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Inclusive of both the check-in and check-out date, matching the backend's
// computeInclusiveDayCount (a same-day stay is 1 day, not 0). Deliberately
// takes only the 'YYYY-MM-DD' date portion, not check-in/check-out time —
// "nights stayed" is a calendar-day count a guest's exact arrival/departure
// clock time shouldn't shift, same reasoning the Quotation's own eventual
// total_days is expected to reflect. Returns null when either date is
// missing or unparseable, and does not guard checkOut < checkIn (an invalid
// range) — that's this step's own UI-level validation, not this pure
// function's job.
export const computeTotalDays = (checkInDate: string, checkOutDate: string): number | null => {
  if (!checkInDate || !checkOutDate) {
    return null;
  }
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
};
