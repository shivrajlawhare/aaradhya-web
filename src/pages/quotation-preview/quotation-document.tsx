import type { ReactNode } from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { z } from 'zod';
import aaradhyaMark from '../../assets/aaradhya-mark.svg';
import aaradhyaHeaderText from '../../assets/header-text.svg';
import {
  ClientContactRole,
  ItemType,
  SessionStatus,
  clientContactSchema,
  filteredAccommodationResultSchema,
  filteredItemResultSchema,
  filteredSessionResultSchema,
  manualLineItemResultSchema,
} from '../../contract';
import { toDateInputValue } from '../event-detail/date-input';
import { roundToCurrency } from '../../utils/accommodation-calculations';
import {
  formatAccommodationDate,
  formatEventDate,
  formatQuotationAmount,
  formatQuotationGenerationDate,
  formatQuotationItemCost,
  formatQuotationPax,
  formatQuotationRupees,
  formatSessionDuration,
} from '../../utils/quotation-formatting';
import {
  brandLockupStyles,
  bulletedListStyles,
  ceremonyRowStyles,
  closingLineStyles,
  costSummaryHighlightLabelCellStyles,
  costSummaryHighlightNumericCellStyles,
  dateSectionStyles,
  headerRowStyles,
  headerTextImageStyles,
  markImageStyles,
  numberedListStyles,
  numericCellStyles,
  orgDetailsLineStyles,
  orgDetailsStyles,
  quotationDateStyles,
  rootStyles,
  rowLabelCellStyles,
  sectionHeadingStyles,
  sectionStyles,
  tableScrollStyles,
  tableStyles,
  titleRowStyles,
  titleTextStyles,
  totalChargesCellStyles,
  totalCostSummarySectionStyles,
  totalOccupancyCellStyles,
} from './quotation-document.styles';

// The org's own real, static letterhead details (SRS §4.7a) — identical on
// every generated Quotation regardless of Event, same reasoning
// aaradhya-api's own quotation-pdf.ts TERMS_AND_CONDITIONS/BANK_ACCOUNT_
// DETAILS constants already apply to the static footer (STORY-073's own
// territory). Sourced from example_quatation_1.pdf/example_quatation_2.pdf
// (docs/example_quatations) rather than invented.
const ORG_GST_NUMBER = '27ABLFA0695F1ZC';
const ORG_ADDRESS_LINES = ['Mumbai-Goa Highway, Akeri,', 'Maharashtra – 416510'];
const ORG_CONTACT = '+91 9423362122';

// STORY-073 — the static footer (SRS FR-QUO-10): identical on every
// generated Quotation regardless of Event data, verified character-for-
// character against both reference quotations (docs/example_quatations/),
// which carry byte-identical wording for this whole section. Deliberately
// NOT reused from aaradhya-api's own quotation-pdf.ts TERMS_AND_CONDITIONS
// constant — that file's "Rs. 15,000" substitution for the reference's own
// "₹15,000" is a pdfkit-only workaround (its default Helvetica font has no
// Rupee glyph under WinAnsiEncoding); this component renders as real HTML/
// CSS (today in-browser, later via a server-side Playwright render of this
// same tree per Aaradhya_Quotation_PDF_Strategy.md), which has no such
// constraint, so it reproduces the reference's own literal "₹15,000" text
// instead of carrying that unrelated renderer's limitation forward.
const TERMS_AND_CONDITIONS = [
  'The venue rental charges shall be considered as the booking amount and must be paid to confirm the booking.',
  'The remaining balance must be paid on the day of the event or prior to the commencement of the function.',
  'Any additional services or requirements requested beyond this quotation will be charged separately.',
  'Prices are subject to change based on customization and specific event requirements.',
  "The cancellation policy shall apply as per the management's terms and conditions.",
  'Any damage to the hotel property, equipment, furniture, fixtures, décor, or any other assets caused during the event by the client or guests will be chargeable.',
  'This quotation is valid for one (1) month from the date of issue.',
  '200 ml packaged drinking water bottles will be provided as per the confirmed guest count (Pax).',
  'Banquet Hall Timings (with Air Conditioning): 9:00 AM to 3:00 PM. Any extension is subject to management approval and availability.',
  'Additional hall usage beyond the approved timing will be charged at ₹15,000 per hour.',
  'Room Check-in: 12:00 PM | Check-out: 11:00 AM. Early check-in, late check-out, or extended stay will be subject to availability and additional charges.',
  'Ample parking is available within the hotel premises, and security will be provided for vehicles parked inside the campus. However, the management shall not be responsible for any loss, theft, or damage to vehicles parked outside the hotel premises.',
  'The management reserves the right to modify these terms and conditions without prior notice, if required.',
];

const DOCUMENTS_REQUIRED = [
  'Aadhar Card',
  'Pan Card',
  'Leaving / Birth Certificate',
  'Ration Card',
  '2 passport size photos each',
  'Wedding Card',
];

const BANK_ACCOUNT_DETAILS: [label: string, value: string][] = [
  ['Name', 'Aaradhya Adorer'],
  ['Account Number', '142320110000165'],
  ['Bank Name', 'Bank of India'],
  ['Branch Name', 'Talawade'],
  ['IFSC', 'BKID0001423'],
  ['GST Number', '27ABLFA0695F1ZC'],
];

// "Point of Contact", not the raw enum value "POC" — the only label among
// the four that isn't already the exact display text (SRS §5.3's default
// rows). A "Custom" row has no separate stored label anywhere in the data
// model (ClientContactAttributes is name/contactNumber/role only, aaradhya-
// api's src/models/event.ts) — falling back to "Custom" itself is a known,
// pre-existing gap this story doesn't introduce or attempt to close.
const CLIENT_CONTACT_ROLE_LABELS: Record<ClientContactRole, string> = {
  [ClientContactRole.Bride]: 'Bride',
  [ClientContactRole.Groom]: 'Groom',
  [ClientContactRole.POC]: 'Point of Contact',
  [ClientContactRole.Custom]: 'Custom',
};

// Matches accommodation-step.tsx's own EXTRA_BEDS_ROOM_TYPE constant — not
// imported from there since that file doesn't export it (its own
// wizard-local concern), same "mirrored, not shared" precedent this file's
// CLIENT_CONTACT_ROLE_LABELS/ORG_* constants already set. A Room Line is
// identified as the mandatory Extra Beds row by this exact roomType string,
// the only signal the data model itself carries (RoomLineAttributes has no
// separate "isExtraBeds" flag).
const EXTRA_BEDS_ROOM_TYPE = 'Extra Beds';

// Both reference PDFs print the exact same "12pm"/"11am" on every
// Accommodation Details row regardless of Event — this is the org's own
// fixed Room Check-in/Check-out policy (also spelled out in aaradhya-api's
// quotation-pdf.ts static Terms & Conditions block: "Room Check-in: 12:00
// PM | Check-out: 11:00 AM"), not a per-Event stored value; the
// Accommodation Block's own data model has no check-in/check-out TIME
// field at all (only checkIn/checkOut dates).
const ACCOMMODATION_CHECK_IN_TIME = '12pm';
const ACCOMMODATION_CHECK_OUT_TIME = '11am';

// Mirrors aaradhya-api's own services/quotation.ts FOOD_GST_RATE_PERCENT —
// the fallback when an Event's own foodGstRatePercent is entirely absent
// (a role this document is fed for that doesn't see it, per filteredEvent
// ResultSchema — see QuotationDocumentProps' own comment), not a value this
// component ever chooses over an Event's real stored rate.
const FOOD_GST_RATE_PERCENT_DEFAULT = 5;

// This story's own AC: the two reference PDFs phrase the Total Cost
// Summary's per-date block label differently ("Wedding Venue and Catering
// – 10/12/2026" vs "Venue and Catering 26 feb 2027") — picked example_
// quatation_1.pdf's own fuller wording and applied it to every Quotation
// this renders, the same "sources disagree, standardize on one convention"
// call STORY-071's own Event Details heading already makes. "Wedding" here
// is this fixed label's own literal text, not the Event's actual
// eventFamilyType — an Engagement-only Quotation still prints this same
// word, matching what "applied consistently" requires.
const TOTAL_COST_SUMMARY_DATE_LABEL_PREFIX = 'Wedding Venue and Catering';

// Derived from the contract's own Zod schemas (typescript-rules rule 3),
// not hand-declared — matches this page's own pre-existing PublicSession
// pattern (quotation-preview-page.tsx before this story) rather than
// duplicating the shape. Picked down to just the fields this document
// actually renders; venueCost stays `.optional()` (filteredSessionResult
// Schema's own shape for a non-EventManager caller) so the "default to 0"
// judgment call lives once, here, rather than at every call site — this
// component is meant to be the one shared render tree a future server-side
// Playwright PDF render also feeds (Aaradhya_Quotation_PDF_Strategy.md §4).
export type QuotationDocumentClientContact = z.infer<typeof clientContactSchema>;

// STORY-071 — a Session's own Items, as this document needs them for the
// per-date Event Details tables below. `menuItemNames` replaces the raw
// contract shape's own `menuItems` (an array of ids only, "no populate/
// expand convention exists anywhere yet" per aaradhya-api's own
// itemResultSchema comment) with already-resolved display names — the
// id → name Menu Item lookup is the caller's job (this page today, a future
// server-side Playwright render later, Aaradhya_Quotation_PDF_Strategy.md
// §4), not something this shared render tree should have to do twice.
export type QuotationDocumentSessionItem = Pick<
  z.infer<typeof filteredItemResultSchema>,
  'id' | 'type' | 'mealName' | 'pax' | 'costPerPlate' | 'limitedSeating' | 'eventName' | 'venue' | 'startTime' | 'endTime'
> & {
  menuItemNames: string[];
};

export type QuotationDocumentSession = Pick<
  z.infer<typeof filteredSessionResultSchema>,
  'id' | 'sessionType' | 'venue' | 'venueCost' | 'startDate' | 'startTime' | 'endTime' | 'pax' | 'sessionStatus'
> & {
  items: QuotationDocumentSessionItem[];
};

// tariff/totalInclGst/totalCharges stay `.optional()` (filteredAccommodation
// ResultSchema's own shape for a non-EventManager caller) — defaulted to 0
// inside this component, same reasoning QuotationDocumentSession's venueCost
// already documents.
export type QuotationDocumentAccommodation = Pick<
  z.infer<typeof filteredAccommodationResultSchema>,
  'checkIn' | 'checkOut' | 'totalDays' | 'roomLines' | 'totalOccupancy' | 'totalCharges'
>;

// STORY-072 — the Total Cost Summary's own "manually-added rows" (SRS
// FR-QUO-9a/A13, wizard Step 5). Note stays nullable (manualLineItemResult
// Schema's own shape) — rendered blank, never fabricated, when absent.
export type QuotationDocumentManualLineItem = z.infer<typeof manualLineItemResultSchema>;

export interface QuotationDocumentProps {
  clientContacts: QuotationDocumentClientContact[];
  sessions: QuotationDocumentSession[];
  // `undefined` matches filteredEventResultSchema's own accommodation field
  // (the whole block can be absent for a role that isn't EventManager) —
  // treated the same as an accommodation with no dates and no Room Lines.
  accommodation: QuotationDocumentAccommodation | undefined;
  extraLineItems: QuotationDocumentManualLineItem[];
  // `undefined` matches filteredEventResultSchema's own foodGstRatePercent
  // field (hidden for non-EventManager roles) — defaulted to the same 5%
  // FOOD_GST_RATE_PERCENT the backend falls back to when this Event never
  // had an explicit rate stored (STORY-072).
  foodGstRatePercent: number | undefined;
  // Injectable for deterministic tests — defaults to "now" (FR-QUO-6: always
  // the current date at generation time, never the Event's own createdAt).
  quotationDate?: Date;
}

// The shared render tree for the Quotation (Aaradhya_Quotation_PDF_Strategy.md
// §4: "One React component tree renders both the on-screen Quotation
// Preview and the PDF, so there's no second template to keep in sync") —
// this story (STORY-069) covers the header through the Event Details table;
// STORY-070 through STORY-073 add the remaining sections to this same
// component as they land.
const QuotationDocument = ({
  clientContacts,
  sessions,
  accommodation,
  extraLineItems,
  foodGstRatePercent = FOOD_GST_RATE_PERCENT_DEFAULT,
  quotationDate = new Date(),
}: QuotationDocumentProps) => {
  // A Cancelled Session isn't a real, billable line on the Quotation —
  // matches this screen's own pre-existing filter (quotation-preview-page.tsx,
  // itself mirroring aaradhya-api's STORY-043 PDF renderer and STORY-041's
  // Total Cost Summary exclusion). Two-or-more Sessions sharing a date (this
  // story's own edge case, example_quatation_2.pdf's Halad+Engagement) are
  // intentionally NOT grouped here — each stays its own row, in entry order.
  const activeSessions = sessions.filter((session) => session.sessionStatus === SessionStatus.Active);

  // Extracted rather than an inline ternary in the JSX below (typescript-
  // rules rule 5) — same reasoning quotation-preview-page.tsx's own
  // accommodationSection variable already applies to its Accommodation
  // section.
  let eventDetailsSection: ReactNode;
  if (activeSessions.length === 0) {
    // No real Session data to show a table against yet (e.g. every Session
    // so far is Cancelled) — matches this screen's own pre-existing "No
    // Sessions yet." message rather than rendering a header row over an
    // empty body.
    eventDetailsSection = <Typography>No Sessions yet.</Typography>;
  } else {
    eventDetailsSection = (
      <Box sx={tableScrollStyles}>
        <Table sx={tableStyles} aria-label="Event Details">
          <TableHead>
            <TableRow>
              <TableCell>Event Type</TableCell>
              <TableCell>Event Date</TableCell>
              <TableCell>Event Duration</TableCell>
              <TableCell>No. Of Guests</TableCell>
              <TableCell>Venue Selected</TableCell>
              <TableCell>Selected Venue Cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeSessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell sx={rowLabelCellStyles}>{session.sessionType}</TableCell>
                <TableCell>{formatEventDate(toDateInputValue(session.startDate))}</TableCell>
                <TableCell>{formatSessionDuration(session.startTime ?? '', session.endTime ?? '')}</TableCell>
                <TableCell sx={numericCellStyles}>{session.pax}</TableCell>
                <TableCell>{session.venue}</TableCell>
                <TableCell sx={numericCellStyles}>{formatQuotationAmount(session.venueCost ?? 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  }

  // "Whatever custom room types were entered, in entry order, followed
  // always by Extra Beds last" (this story's own AC) — a renderer-side
  // guarantee, not an assumption about input order: accommodation-step.tsx's
  // own "+ Add Room Line" appends new rows to the end of the array
  // regardless of where the seeded Extra Beds row already sits, so the raw
  // stored order can't be trusted to already end with it.
  const roomLines = accommodation?.roomLines ?? [];
  const orderedRoomLines = [
    ...roomLines.filter((line) => line.roomType !== EXTRA_BEDS_ROOM_TYPE),
    ...roomLines.filter((line) => line.roomType === EXTRA_BEDS_ROOM_TYPE),
  ];

  const checkInCellContent = (
    <>
      {accommodation?.checkIn ? formatAccommodationDate(toDateInputValue(accommodation.checkIn)) : '—'}
      <br />
      {ACCOMMODATION_CHECK_IN_TIME}
    </>
  );
  const checkOutCellContent = (
    <>
      {accommodation?.checkOut ? formatAccommodationDate(toDateInputValue(accommodation.checkOut)) : '—'}
      <br />
      {ACCOMMODATION_CHECK_OUT_TIME}
    </>
  );
  const totalDaysDisplay = accommodation?.totalDays ?? '—';

  // Extracted rather than an inline ternary in the JSX below (typescript-
  // rules rule 5). Check-in/Check-out/Total Days are merged (rowSpan) down
  // the full height of the Room Line rows — reproducing both reference
  // PDFs' layout exactly (this story's own AC) rather than repeating those
  // three values on every row.
  let roomLineRows: ReactNode;
  if (orderedRoomLines.length === 0) {
    // This story's own edge case: even with zero Room Lines at all (no
    // Extra Beds row present in the data either), the table still renders
    // its full column set rather than an empty/hidden table.
    roomLineRows = (
      <TableRow>
        <TableCell>{checkInCellContent}</TableCell>
        <TableCell>{checkOutCellContent}</TableCell>
        <TableCell sx={numericCellStyles}>{totalDaysDisplay}</TableCell>
        <TableCell />
        <TableCell />
        <TableCell />
        <TableCell />
        <TableCell />
      </TableRow>
    );
  } else {
    roomLineRows = orderedRoomLines.map((line, index) => (
      <TableRow key={index}>
        {index === 0 && (
          <>
            <TableCell rowSpan={orderedRoomLines.length}>{checkInCellContent}</TableCell>
            <TableCell rowSpan={orderedRoomLines.length}>{checkOutCellContent}</TableCell>
            <TableCell rowSpan={orderedRoomLines.length} sx={numericCellStyles}>
              {totalDaysDisplay}
            </TableCell>
          </>
        )}
        <TableCell sx={rowLabelCellStyles}>{line.roomType}</TableCell>
        <TableCell sx={numericCellStyles}>{line.occupancy}</TableCell>
        <TableCell sx={numericCellStyles}>{line.tariff ?? 0}</TableCell>
        <TableCell sx={numericCellStyles}>{line.noOfRooms}</TableCell>
        <TableCell sx={numericCellStyles}>{line.totalInclGst ?? 0}</TableCell>
      </TableRow>
    ));
  }

  // STORY-071 — one Event Details table per distinct calendar date spanned
  // by the Event's Sessions, in date order. Keyed by each Session's own
  // startDate only, not its full startDate..endDate range — neither
  // reference quotation (docs/example_quatations/) has a multi-day Session,
  // so spanning a Session's items across every date it covers is unverified
  // and left for a future story if it's ever actually needed. Two Sessions
  // sharing a date (example_quatation_2.pdf's Halad + Engagement, both
  // 26/02/2027) pool into ONE table for that date rather than two — their
  // Items interleave in the same order the Sessions themselves already
  // appear in (activeSessions' own array order, i.e. entry order) followed
  // by each Session's own item order, exactly reproducing example_
  // quatation_2.pdf's own row sequence (Halad's Items, then Engagement's).
  const dateGroups: { date: string; items: QuotationDocumentSessionItem[] }[] = [];
  for (const session of activeSessions) {
    const dateKey = toDateInputValue(session.startDate);
    const existingGroup = dateGroups.find((group) => group.date === dateKey);
    if (existingGroup) {
      existingGroup.items.push(...session.items);
    } else {
      dateGroups.push({ date: dateKey, items: [...session.items] });
    }
  }
  dateGroups.sort((a, b) => a.date.localeCompare(b.date));

  // Extracted rather than an inline ternary in the JSX below (typescript-
  // rules rule 5). Reproduces every one of the three inline-label variants
  // both reference PDFs show for a Ceremony/Event Item row (this story's
  // own AC): venue only ("Engagement Sangeet - Poolside"), time only
  // ("Muhurta 11am to 12.30pm"), and neither (bare "Muhurta") — an Item
  // with every field blank (example_quatation_2.pdf's own wholly-blank
  // divider row) falls out of the same logic as an empty string. Time is
  // joined via the existing formatSessionDuration ("to", not the reference's
  // own one-off "–") and venue is always appended with " - " — both
  // reference PDFs disagree with each other on this exact punctuation
  // (example_quatation_1.pdf's "Muhurta 11am – 12.30pm" vs. example_
  // quatation_2.pdf's own dominant "to" convention, itself shared by the
  // Event Details "Duration" column and the Food/Dining "Time" column in
  // both documents), so this picks the one convention already used
  // everywhere else rather than reproducing the outlier, the same kind of
  // "sources disagree, standardize on one" call this story's own heading
  // format bullet already makes explicitly.
  const buildCeremonyLabel = (item: QuotationDocumentSessionItem): string => {
    const nameAndTimeParts: string[] = [];
    if (item.eventName) {
      nameAndTimeParts.push(item.eventName);
    }
    const timePart = formatSessionDuration(item.startTime ?? '', item.endTime ?? '');
    if (timePart) {
      nameAndTimeParts.push(timePart);
    }
    const nameAndTime = nameAndTimeParts.join(' ');
    if (!item.venue) {
      return nameAndTime;
    }
    return nameAndTime ? `${nameAndTime} - ${item.venue}` : item.venue;
  };

  // Extracted rather than an inline ternary in the JSX below (typescript-
  // rules rule 5) — a Ceremony Item renders as one merged grey row, a
  // Food/Dining Item as the full 5-column row.
  const renderDateItemRow = (item: QuotationDocumentSessionItem): ReactNode => {
    if (item.type === ItemType.Event) {
      return (
        <TableRow key={item.id}>
          <TableCell colSpan={5} sx={ceremonyRowStyles}>
            {buildCeremonyLabel(item)}
          </TableCell>
        </TableRow>
      );
    }
    return (
      <TableRow key={item.id}>
        <TableCell sx={rowLabelCellStyles}>{item.mealName}</TableCell>
        <TableCell>{formatSessionDuration(item.startTime ?? '', item.endTime ?? '')}</TableCell>
        <TableCell sx={numericCellStyles}>{formatQuotationPax(item.pax ?? 0, item.limitedSeating ?? false)}</TableCell>
        <TableCell sx={numericCellStyles}>{formatQuotationItemCost(item.costPerPlate ?? 0)}</TableCell>
        <TableCell>
          {item.menuItemNames.map((menuItemName, index) => (
            <div key={index}>{`${index + 1}. ${menuItemName}`}</div>
          ))}
        </TableCell>
      </TableRow>
    );
  };

  const eventDetailsByDateSections = dateGroups.map((group) => (
    <Box key={group.date} sx={dateSectionStyles}>
      <Typography component="h2" sx={sectionHeadingStyles}>
        Event Details – {formatEventDate(group.date)}
      </Typography>
      <Box sx={tableScrollStyles}>
        <Table sx={tableStyles} aria-label={`Event Details – ${formatEventDate(group.date)}`}>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Time</TableCell>
              <TableCell>Number of Pax</TableCell>
              <TableCell>Cost</TableCell>
              <TableCell>Menu</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{group.items.map((item) => renderDateItemRow(item))}</TableBody>
        </Table>
      </Box>
    </Box>
  ));

  // STORY-072 — Total Cost Summary (SRS FR-QUO-9). Reuses dateGroups
  // (STORY-071's own per-date Session+Item pooling, already in date order)
  // rather than a second, possibly-divergent grouping: a venue row is one
  // per Active Session on that date (not one per date — example_
  // quatation_2.pdf's own Halad+Engagement both dated 26/02/2027 print two
  // separate venue rows), a food row is one per Meal Item on that date
  // (Ceremony/Event Items never appear in this table at all, in either
  // reference PDF).
  const costSummaryDateBlocks = dateGroups.map((group) => ({
    date: group.date,
    sessionsForDate: activeSessions.filter((session) => toDateInputValue(session.startDate) === group.date),
    mealItemsForDate: group.items.filter((item) => item.type === ItemType.Meal),
  }));

  // FR-QUO-8: a limited-seating Meal Item's Total Cost is billed as pax=1
  // (a flat per-slot charge), not the literal headcount — verified against
  // example_quatation_1.pdf's own "Chaat Counter" row (1 × 12000 = 12000)
  // reproduced identically for every L.S. row in both reference PDFs.
  // Rounded per-row, not only once on the accumulated sum — matches
  // total-cost-summary.ts's own computeFoodItemTotalCost exactly, so the
  // wizard's live Step 5 preview and this actually-generated Quotation
  // can't drift apart over a fractional Cost Per Plate.
  const computeFoodItemTotalCost = (item: QuotationDocumentSessionItem): number =>
    roundToCurrency((item.limitedSeating ? 1 : (item.pax ?? 0)) * (item.costPerPlate ?? 0));

  // Exactly one Food Cost row for the WHOLE table (a per-date subtotal is
  // this story's own explicit non-goal) — summed across every date's own
  // Meal Items, not just costSummaryDateBlocks' last entry.
  const allMealItemsAcrossDates = dateGroups.flatMap((group) => group.items.filter((item) => item.type === ItemType.Meal));
  const foodCostTotal = roundToCurrency(
    allMealItemsAcrossDates.reduce((total, item) => total + computeFoodItemTotalCost(item), 0),
  );
  // Verified against both reference PDFs' own printed figures: 597150 ×
  // 1.05 = 627007.5 (example_quatation_1.pdf), 391500 × 1.05 = 411075
  // (example_quatation_2.pdf) — printed as-is, not rounded to a whole
  // rupee (that only happens for the Grand Total's own formatted display,
  // via formatQuotationRupees — see this table's own JSX below).
  const foodCostWithGst = roundToCurrency(foodCostTotal * (1 + foodGstRatePercent / 100));
  // The new "GST on food X%" column's own aggregate cell — derived from the
  // two already-reference-verified totals above (foodCostWithGst -
  // foodCostTotal) rather than summing each row's own rounded
  // computeFoodItemGst below, so this cell and Total Cost/Total Cost with
  // GST beside it always add up exactly, with no per-row rounding drift.
  const foodGstOnFoodTotal = roundToCurrency(foodCostWithGst - foodCostTotal);
  const computeFoodItemGst = (item: QuotationDocumentSessionItem): number =>
    roundToCurrency(computeFoodItemTotalCost(item) * (foodGstRatePercent / 100));
  const venueTotal = roundToCurrency(activeSessions.reduce((total, session) => total + (session.venueCost ?? 0), 0));
  const accommodationTotal = accommodation?.totalCharges ?? 0;
  const manualLineItemsTotal = roundToCurrency(extraLineItems.reduce((total, item) => total + item.amount, 0));
  // Deliberately excludes the older, fixed extras.decoration/photographer/
  // bhatji trio (STORY-042) — this story's own AC enumerates exactly four
  // categories feeding the Grand Total (venue rows, the one Food Cost row,
  // Accommodation, "every manual row"), and both reference PDFs' own
  // Decoration/Photographer/Bhatji lines carry a note (STORY-068's own
  // extraLineItems has one; the fixed trio never did), so those three rows
  // are themselves manually-added rows here, not a separate category. A
  // real, non-zero extras.decoration/photographer/bhatji on an Event would
  // NOT appear in this table or its Grand Total — a known, accepted
  // divergence from the older getQuotationSummary/TotalCostSummaryPanel
  // rollup (which still combines both), not something this story asks to
  // reconcile.
  const grandTotal = roundToCurrency(venueTotal + foodCostWithGst + accommodationTotal + manualLineItemsTotal);

  const totalCostSummaryRows = costSummaryDateBlocks.flatMap((block) => {
    const blockRows = [
      ...block.sessionsForDate.map((session) => ({ kind: 'venue' as const, session })),
      ...block.mealItemsForDate.map((item) => ({ kind: 'food' as const, item })),
    ];
    const blockLabel = `${TOTAL_COST_SUMMARY_DATE_LABEL_PREFIX} – ${formatEventDate(block.date)}`;

    return blockRows.map((row, index) => {
      const costItemCell = index === 0 && (
        <TableCell rowSpan={blockRows.length} sx={rowLabelCellStyles}>
          {blockLabel}
        </TableCell>
      );

      if (row.kind === 'venue') {
        return (
          <TableRow key={row.session.id}>
            {costItemCell}
            <TableCell>{row.session.venue}</TableCell>
            <TableCell />
            <TableCell />
            <TableCell />
            <TableCell />
            <TableCell sx={numericCellStyles}>{row.session.venueCost ?? 0}</TableCell>
          </TableRow>
        );
      }

      const pax = row.item.limitedSeating ? 1 : (row.item.pax ?? 0);
      const costPerPlate = row.item.costPerPlate ?? 0;
      return (
        <TableRow key={row.item.id}>
          {costItemCell}
          <TableCell>{row.item.mealName}</TableCell>
          <TableCell sx={numericCellStyles}>{pax}</TableCell>
          <TableCell sx={numericCellStyles}>{costPerPlate}</TableCell>
          <TableCell sx={numericCellStyles}>{computeFoodItemTotalCost(row.item)}</TableCell>
          <TableCell sx={numericCellStyles}>{computeFoodItemGst(row.item)}</TableCell>
          <TableCell />
        </TableRow>
      );
    });
  });

  return (
    <Box sx={rootStyles}>
      <Box sx={headerRowStyles}>
        <Box sx={brandLockupStyles}>
          <Box component="img" src={aaradhyaMark} alt="Aaradhya" sx={markImageStyles} />
          <Box
            component="img"
            src={aaradhyaHeaderText}
            alt="Aaradhya — A Complete Destination"
            sx={headerTextImageStyles}
          />
        </Box>
        <Box sx={orgDetailsStyles}>
          <Typography component="div" sx={orgDetailsLineStyles}>
            GST No.: {ORG_GST_NUMBER}
          </Typography>
          <Typography component="div" sx={orgDetailsLineStyles}>
            Address: {ORG_ADDRESS_LINES[0]}
          </Typography>
          <Typography component="div" sx={orgDetailsLineStyles}>
            {ORG_ADDRESS_LINES[1]}
          </Typography>
          <Typography component="div" sx={orgDetailsLineStyles}>
            Contact: {ORG_CONTACT}
          </Typography>
        </Box>
      </Box>

      <Box sx={titleRowStyles}>
        <Typography component="h1" sx={titleTextStyles}>
          Event Quotation
        </Typography>
        <Typography sx={quotationDateStyles}>
          Quotation Date: {formatQuotationGenerationDate(quotationDate)}
        </Typography>
      </Box>

      <Box sx={sectionStyles}>
        <Typography component="h2" sx={sectionHeadingStyles}>
          Client Details
        </Typography>
        <Box sx={tableScrollStyles}>
          <Table sx={tableStyles} aria-label="Client Details">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Name</TableCell>
                <TableCell>Contact Number</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientContacts.map((contact, index) => (
                <TableRow key={index}>
                  <TableCell sx={rowLabelCellStyles}>{CLIENT_CONTACT_ROLE_LABELS[contact.role]}</TableCell>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell>{contact.contactNumber}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Box sx={sectionStyles}>
        <Typography component="h2" sx={sectionHeadingStyles}>
          Event Details
        </Typography>
        {eventDetailsSection}
      </Box>

      <Box sx={sectionStyles}>
        <Typography component="h2" sx={sectionHeadingStyles}>
          Accommodation Details
        </Typography>
        <Box sx={tableScrollStyles}>
          <Table sx={tableStyles} aria-label="Accommodation Details">
            <TableHead>
              <TableRow>
                <TableCell>Check in</TableCell>
                <TableCell>Check out</TableCell>
                <TableCell>Total Days</TableCell>
                <TableCell>Room Type</TableCell>
                <TableCell>Occ.</TableCell>
                <TableCell>Tariff</TableCell>
                <TableCell>No. Of Rooms</TableCell>
                <TableCell>Total including GST</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roomLineRows}
              <TableRow>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell sx={rowLabelCellStyles}>Total Occ.</TableCell>
                <TableCell sx={totalOccupancyCellStyles}>{accommodation?.totalOccupancy ?? 0}</TableCell>
                <TableCell />
                <TableCell sx={rowLabelCellStyles}>Total Charges</TableCell>
                <TableCell sx={totalChargesCellStyles}>{formatQuotationRupees(accommodation?.totalCharges ?? 0)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>

      {eventDetailsByDateSections}

      <Box sx={totalCostSummarySectionStyles}>
        <Typography component="h2" sx={sectionHeadingStyles}>
          Total Cost Summary
        </Typography>
        <Box sx={tableScrollStyles}>
          <Table sx={tableStyles} aria-label="Total Cost Summary">
            <TableHead>
              <TableRow>
                <TableCell>Cost Item</TableCell>
                <TableCell>Sub Cost Item</TableCell>
                <TableCell>Pax</TableCell>
                <TableCell>Cost Per Plate</TableCell>
                <TableCell>Total Cost</TableCell>
                <TableCell>GST on food {foodGstRatePercent}%</TableCell>
                <TableCell>Total Cost with GST</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {totalCostSummaryRows}
              <TableRow>
                <TableCell sx={costSummaryHighlightLabelCellStyles}>Food Cost</TableCell>
                <TableCell sx={costSummaryHighlightLabelCellStyles} />
                <TableCell sx={costSummaryHighlightLabelCellStyles} />
                <TableCell sx={costSummaryHighlightLabelCellStyles} />
                <TableCell sx={costSummaryHighlightNumericCellStyles}>{foodCostTotal}</TableCell>
                <TableCell sx={costSummaryHighlightNumericCellStyles}>{foodGstOnFoodTotal}</TableCell>
                <TableCell sx={costSummaryHighlightNumericCellStyles}>{foodCostWithGst}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={rowLabelCellStyles}>Accommodation</TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell sx={numericCellStyles}>{accommodationTotal}</TableCell>
              </TableRow>
              {extraLineItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell sx={rowLabelCellStyles}>{item.name}</TableCell>
                  <TableCell>{item.note ?? ''}</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell sx={numericCellStyles}>{item.amount}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell sx={costSummaryHighlightLabelCellStyles}>Grand Total</TableCell>
                <TableCell sx={costSummaryHighlightLabelCellStyles} />
                <TableCell sx={costSummaryHighlightLabelCellStyles} />
                <TableCell sx={costSummaryHighlightNumericCellStyles}>{formatQuotationRupees(grandTotal)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>

      {/* STORY-073 — the static footer (SRS FR-QUO-10): not user-editable
          from any screen in the app, compiled directly into this render
          tree from the fixed constants above, the same way the header's own
          ORG_GST_NUMBER/ORG_ADDRESS_LINES/ORG_CONTACT already are. */}
      <Box sx={sectionStyles}>
        <Typography component="h2" sx={sectionHeadingStyles}>
          Terms & Conditions
        </Typography>
        <Box component="ul" sx={bulletedListStyles} aria-label="Terms & Conditions">
          {TERMS_AND_CONDITIONS.map((term, index) => (
            <li key={index}>{term}</li>
          ))}
        </Box>
      </Box>

      <Box sx={sectionStyles}>
        <Typography component="h2" sx={sectionHeadingStyles}>
          Documents Required from Bride and Groom
        </Typography>
        <Box component="ol" sx={numberedListStyles} aria-label="Documents Required from Bride and Groom">
          {DOCUMENTS_REQUIRED.map((document, index) => (
            <li key={index}>{document}</li>
          ))}
        </Box>
      </Box>

      <Box sx={sectionStyles}>
        <Typography component="h2" sx={sectionHeadingStyles}>
          Bank Account Details
        </Typography>
        <Box sx={tableScrollStyles}>
          <Table sx={tableStyles} aria-label="Bank Account Details">
            <TableBody>
              {BANK_ACCOUNT_DETAILS.map(([label, value]) => (
                <TableRow key={label}>
                  <TableCell sx={rowLabelCellStyles}>{label}</TableCell>
                  <TableCell>{value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Box sx={sectionStyles}>
        <Typography sx={closingLineStyles}>Regards</Typography>
        <Typography sx={closingLineStyles}>Aaradhya Banquets</Typography>
      </Box>
    </Box>
  );
};

export default QuotationDocument;
