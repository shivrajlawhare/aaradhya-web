import type { ReactNode } from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { z } from 'zod';
import aaradhyaMark from '../../assets/aaradhya-mark.svg';
import aaradhyaHeaderText from '../../assets/header-text.svg';
import {
  ClientContactRole,
  clientContactSchema,
  filteredAccommodationResultSchema,
  filteredItemResultSchema,
  filteredSessionResultSchema,
  ItemType,
  manualLineItemResultSchema,
  SessionStatus,
} from '../../contract';
import {
  formatAccommodationDate,
  formatEventDate,
  formatQuotationAmount,
  formatQuotationGenerationDate,
  formatQuotationItemCost,
  formatQuotationPax,
  formatQuotationRupeeAmount,
  formatQuotationRupees,
  formatSessionDuration,
} from '../../utils/quotation-formatting';
import { toDateInputValue } from '../event-detail/date-input';
import {
  computeBilledPax,
  computeFoodItemGst,
  computeFoodItemTotalCost,
  computeQuotationTotals,
  groupSessionsByDate,
} from './quotation-calculations';
import {
  bankLabelCellStyles,
  brandLockupStyles,
  bulletedListStyles,
  ceremonyRowStyles,
  closingLineStyles,
  closingNameStyles,
  closingStyles,
  dateSectionStyles,
  discountSpacerCellStyles,
  documentsAndBankStyles,
  headerRowStyles,
  headerTextImageStyles,
  highlightLabelCellStyles,
  highlightNumericCellStyles,
  markImageStyles,
  mergedDescriptionCellStyles,
  numberedListStyles,
  numericCellStyles,
  numericHeaderStyles,
  orgDetailsStyles,
  quotationDateStyles,
  rootStyles,
  rowLabelCellStyles,
  sectionHeadingStyles,
  sectionStyles,
  tableStyles,
  titleRowStyles,
  titleTextStyles,
  totalCostSummarySectionStyles,
  totalOccupancyCellStyles,
} from './quotation-document.styles';

// The org's own static letterhead details (SRS §4.7a), identical on every
// Quotation; sourced from the reference quotations (docs/example_quatations).
const ORG_GST_NUMBER = '27ABLFA0695F1ZC';
const ORG_ADDRESS_LINES = ['Mumbai-Goa Highway, Akeri,', 'Maharashtra – 416510'];
const ORG_CONTACT = '+91 9423362122';

interface TermsAndConditionsItem {
  // An optional bold lead-in, rendered before `text`.
  strong?: string;
  text: string;
}

// The 14 Terms & Conditions bullets (CR-1 5B.3), verbatim and in order.
// Only bullet 1's first clause is bold. Real HTML/CSS, so "₹15,000" prints
// with its own glyph (no pdfkit-style "Rs." workaround).
const TERMS_AND_CONDITIONS: TermsAndConditionsItem[] = [
  {
    strong: 'GST at 18% will be applicable on venue rental and related charges',
    text: ', while other services will be taxed as per their respective applicable GST rates.',
  },
  {
    text: 'The venue rental charges shall be considered as the booking amount and must be paid to confirm the booking.',
  },
  { text: 'The remaining balance must be paid on the day of the event or prior to the commencement of the function.' },
  { text: 'Any additional services or requirements requested beyond this quotation will be charged separately.' },
  { text: 'Prices are subject to change based on customization and specific event requirements.' },
  { text: "The cancellation policy shall apply as per the management's terms and conditions." },
  {
    text: 'Any damage to the hotel property, equipment, furniture, fixtures, décor, or any other assets caused during the event by the client or guests will be chargeable.',
  },
  { text: 'This quotation is valid for one (1) month from the date of issue.' },
  { text: '200 ml packaged drinking water bottles will be provided as per the confirmed guest count (Pax).' },
  {
    text: 'Banquet Hall Timings (with Air Conditioning): 9:00 AM to 3:00 PM. Any extension is subject to management approval and availability.',
  },
  { text: 'Additional hall usage beyond the approved timing will be charged at ₹15,000 per hour.' },
  {
    text: 'Room Check-in: 12:00 PM | Check-out: 11:00 AM. Early check-in, late check-out, or extended stay will be subject to availability and additional charges.',
  },
  {
    text: 'Ample parking is available within the hotel premises, and security will be provided for vehicles parked inside the campus. However, the management shall not be responsible for any loss, theft, or damage to vehicles parked outside the hotel premises.',
  },
  { text: 'The management reserves the right to modify these terms and conditions without prior notice, if required.' },
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

// "Point of Contact", not the raw enum value "POC". A Custom row has no
// stored label in the data model, so it prints "Custom".
const CLIENT_CONTACT_ROLE_LABELS: Record<ClientContactRole, string> = {
  [ClientContactRole.Bride]: 'Bride',
  [ClientContactRole.Groom]: 'Groom',
  [ClientContactRole.POC]: 'Point of Contact',
  [ClientContactRole.Custom]: 'Custom',
};

// The mandatory Extra Beds room line is identified by this exact name (the
// data model carries no separate flag); it always prints last.
const EXTRA_BEDS_ROOM_TYPE = 'Extra Beds';

// The org's fixed room check-in/check-out policy (T&C bullet 12), printed on
// every Accommodation row; the data model stores dates only.
const ACCOMMODATION_CHECK_IN_TIME = '12pm';
const ACCOMMODATION_CHECK_OUT_TIME = '11am';

// Mirrors aaradhya-api's FOOD_GST_RATE_PERCENT — only used when an Event has
// no stored rate (a role that doesn't see it).
const FOOD_GST_RATE_PERCENT_DEFAULT = 5;

// D14: the per-date block label keeps the date ("Wedding Venue and Catering
// – DD/MM/YYYY"). "Wedding" is fixed text, not the Event's family type.
const TOTAL_COST_SUMMARY_DATE_LABEL_PREFIX = 'Wedding Venue and Catering';

// Contract-derived prop types (typescript-rules rule 3), picked down to the
// fields this document renders. Money fields stay optional (the filtered
// shapes for non-EventManager roles) and default to 0 here, once.
export type QuotationDocumentClientContact = z.infer<typeof clientContactSchema>;

// A Session's Items with menu-item ids already resolved to names by the
// caller (no populate convention exists), so this stays a pure render tree.
export type QuotationDocumentSessionItem = Pick<
  z.infer<typeof filteredItemResultSchema>,
  | 'id'
  | 'type'
  | 'mealName'
  | 'pax'
  | 'costPerPlate'
  | 'limitedSeating'
  | 'eventName'
  | 'venue'
  | 'startTime'
  | 'endTime'
> & {
  menuItemNames: string[];
};

export type QuotationDocumentSession = Pick<
  z.infer<typeof filteredSessionResultSchema>,
  'id' | 'sessionType' | 'venue' | 'venueCost' | 'startDate' | 'startTime' | 'endTime' | 'pax' | 'sessionStatus'
> & {
  items: QuotationDocumentSessionItem[];
};

export type QuotationDocumentAccommodation = Pick<
  z.infer<typeof filteredAccommodationResultSchema>,
  | 'checkIn'
  | 'checkOut'
  | 'totalNights'
  | 'roomLines'
  | 'totalOccupancy'
  | 'totalCharges'
  | 'discountPercent'
  | 'discountAmount'
  | 'finalAmount'
>;

// The Total Cost Summary's manually-added rows (wizard step 5). The note
// stays nullable and prints blank when absent.
export type QuotationDocumentManualLineItem = z.infer<typeof manualLineItemResultSchema>;

export interface QuotationDocumentProps {
  clientContacts: QuotationDocumentClientContact[];
  sessions: QuotationDocumentSession[];
  // Absent for a role that doesn't see accommodation — treated as empty.
  accommodation: QuotationDocumentAccommodation | undefined;
  extraLineItems: QuotationDocumentManualLineItem[];
  foodGstRatePercent: number | undefined;
  // Injectable for deterministic tests — defaults to "now" (FR-QUO-6).
  quotationDate?: Date;
}

// A Ceremony row's merged label: "<name> <time> - <venue>", any part may be
// missing (all three variants appear in the reference quotations).
const buildCeremonyLabel = (item: QuotationDocumentSessionItem): string => {
  const nameAndTime = [item.eventName, formatSessionDuration(item.startTime ?? '', item.endTime ?? '')]
    .filter(Boolean)
    .join(' ');
  if (!item.venue) {
    return nameAndTime;
  }
  return nameAndTime ? `${nameAndTime} - ${item.venue}` : item.venue;
};

interface DateItemRowProps {
  item: QuotationDocumentSessionItem;
}

// A Ceremony Item is one merged, shaded row; a Food/Dining Item fills the
// five columns.
const DateItemRow = ({ item }: DateItemRowProps) => {
  if (item.type === ItemType.Event) {
    return (
      <TableRow>
        <TableCell colSpan={5} sx={ceremonyRowStyles}>
          {buildCeremonyLabel(item)}
        </TableCell>
      </TableRow>
    );
  }
  return (
    <TableRow>
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

interface SectionHeadingProps {
  children: ReactNode;
}

const SectionHeading = ({ children }: SectionHeadingProps) => (
  <Typography component="h2" sx={sectionHeadingStyles}>
    {children}
  </Typography>
);

// The Quotation — one render tree for both the on-screen preview and the
// server-side PDF (aaradhya-api's browser-pdf.ts drives a headless browser to
// this same page with ?print=1; Aaradhya_Quotation_PDF_Strategy.md §4).
// Laid out per Figma Quotation/Document and example_quatation_3.pdf.
const QuotationDocument = ({
  clientContacts,
  sessions,
  accommodation,
  extraLineItems,
  foodGstRatePercent = FOOD_GST_RATE_PERCENT_DEFAULT,
  quotationDate = new Date(),
}: QuotationDocumentProps) => {
  // A Cancelled Session isn't a billable line anywhere on the Quotation.
  const activeSessions = sessions.filter((session) => session.sessionStatus === SessionStatus.Active);
  const dateGroups = groupSessionsByDate<QuotationDocumentSessionItem, QuotationDocumentSession>(activeSessions);
  const totals = computeQuotationTotals({
    sessions: activeSessions,
    accommodationFinalAmount: accommodation?.finalAmount ?? 0,
    extraLineItemAmounts: extraLineItems.map((item) => item.amount),
    foodGstRatePercent,
  });

  let eventDetailsSection: ReactNode;
  if (activeSessions.length === 0) {
    eventDetailsSection = <Typography>No Sessions yet.</Typography>;
  } else {
    eventDetailsSection = (
      <Table sx={tableStyles} aria-label="Event Details">
        <TableHead>
          <TableRow>
            <TableCell>Event Type</TableCell>
            <TableCell>Event Date</TableCell>
            <TableCell>Event Duration</TableCell>
            <TableCell sx={numericHeaderStyles}>No. Of Guests</TableCell>
            <TableCell>Venue Selected</TableCell>
            <TableCell sx={numericHeaderStyles}>Selected Venue Cost</TableCell>
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
    );
  }

  // Entered room types in entry order, then Extra Beds last — a renderer
  // guarantee, since "+ Add Room Line" appends after the seeded Extra Beds.
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
  const totalNightsDisplay = accommodation?.totalNights ?? '—';

  // Check in / Check out / Total Nights merge (rowSpan) down every room line.
  let roomLineRows: ReactNode;
  if (orderedRoomLines.length === 0) {
    // Zero room lines still print the full column set.
    roomLineRows = (
      <TableRow>
        <TableCell>{checkInCellContent}</TableCell>
        <TableCell>{checkOutCellContent}</TableCell>
        <TableCell sx={numericCellStyles}>{totalNightsDisplay}</TableCell>
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
              {totalNightsDisplay}
            </TableCell>
          </>
        )}
        <TableCell sx={rowLabelCellStyles}>{line.roomType}</TableCell>
        <TableCell sx={numericCellStyles}>{line.occupancy}</TableCell>
        <TableCell sx={numericCellStyles}>{line.tariff ?? 0}</TableCell>
        <TableCell sx={numericCellStyles}>{line.noOfRooms}</TableCell>
        <TableCell sx={numericCellStyles}>{line.totalTaxable ?? 0}</TableCell>
      </TableRow>
    ));
  }

  // D3: Discount N% and the Final Amount, under Total Charges, only when a
  // discount was given.
  const discountPercent = accommodation?.discountPercent ?? 0;
  let discountRows: ReactNode = null;
  if (discountPercent > 0) {
    discountRows = (
      <>
        <TableRow>
          <TableCell colSpan={6} sx={discountSpacerCellStyles} />
          <TableCell>Discount {discountPercent}%</TableCell>
          <TableCell sx={numericCellStyles}>{formatQuotationRupeeAmount(accommodation?.discountAmount ?? 0)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={6} sx={discountSpacerCellStyles} />
          <TableCell sx={highlightLabelCellStyles}>Final Amount</TableCell>
          <TableCell sx={highlightNumericCellStyles}>
            {formatQuotationRupeeAmount(accommodation?.finalAmount ?? 0)}
          </TableCell>
        </TableRow>
      </>
    );
  }

  const eventDetailsByDateSections = dateGroups.map((group) => {
    const heading = `Event Details – ${formatEventDate(group.date)}`;
    return (
      <Box key={group.date} sx={dateSectionStyles}>
        <SectionHeading>{heading}</SectionHeading>
        <Table sx={tableStyles} aria-label={heading}>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Time</TableCell>
              <TableCell sx={numericHeaderStyles}>Number of Pax</TableCell>
              <TableCell sx={numericHeaderStyles}>Cost</TableCell>
              <TableCell>Menu</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {group.items.map((item) => (
              <DateItemRow key={item.id} item={item} />
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  });

  // Total Cost Summary (FR-QUO-9, D13): per date, one venue row per Session
  // then one food row per Meal Item, under a merged "Wedding Venue and
  // Catering – date" label. Ceremony Items never appear here.
  const totalCostSummaryRows = dateGroups.flatMap((group) => {
    const blockRows = [
      ...group.sessions.map((session) => ({ kind: 'venue' as const, session })),
      ...group.items.filter((item) => item.type === ItemType.Meal).map((item) => ({ kind: 'food' as const, item })),
    ];
    const blockLabel = `${TOTAL_COST_SUMMARY_DATE_LABEL_PREFIX} – ${formatEventDate(group.date)}`;

    return blockRows.map((row, index) => {
      const particularsCell = index === 0 && (
        <TableCell rowSpan={blockRows.length} sx={rowLabelCellStyles}>
          {blockLabel}
        </TableCell>
      );

      if (row.kind === 'venue') {
        return (
          <TableRow key={row.session.id}>
            {particularsCell}
            <TableCell>{row.session.venue}</TableCell>
            <TableCell />
            <TableCell />
            <TableCell />
            <TableCell />
            <TableCell sx={numericCellStyles}>{formatQuotationRupeeAmount(row.session.venueCost ?? 0)}</TableCell>
          </TableRow>
        );
      }

      return (
        <TableRow key={row.item.id}>
          {particularsCell}
          <TableCell>{row.item.mealName}</TableCell>
          <TableCell sx={numericCellStyles}>{computeBilledPax(row.item)}</TableCell>
          <TableCell sx={numericCellStyles}>{row.item.costPerPlate ?? 0}</TableCell>
          <TableCell sx={numericCellStyles}>{computeFoodItemTotalCost(row.item)}</TableCell>
          <TableCell sx={numericCellStyles}>{computeFoodItemGst(row.item, foodGstRatePercent)}</TableCell>
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
          <div>GST No.: {ORG_GST_NUMBER}</div>
          <div>Address: {ORG_ADDRESS_LINES[0]}</div>
          <div>{ORG_ADDRESS_LINES[1]}</div>
          <div>Contact: {ORG_CONTACT}</div>
        </Box>
      </Box>

      <Box sx={titleRowStyles}>
        <Typography component="h1" sx={titleTextStyles}>
          Event Quotation
        </Typography>
        <Typography sx={quotationDateStyles}>Quotation Date: {formatQuotationGenerationDate(quotationDate)}</Typography>
      </Box>

      <Box sx={sectionStyles}>
        <SectionHeading>Client Details</SectionHeading>
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

      <Box sx={sectionStyles}>
        <SectionHeading>Event Details</SectionHeading>
        {eventDetailsSection}
      </Box>

      <Box sx={sectionStyles}>
        <SectionHeading>Accommodation Details</SectionHeading>
        <Table sx={tableStyles} aria-label="Accommodation Details">
          <TableHead>
            <TableRow>
              <TableCell>Check in</TableCell>
              <TableCell>Check out</TableCell>
              <TableCell sx={numericHeaderStyles}>Total Nights</TableCell>
              <TableCell>Room Type</TableCell>
              <TableCell sx={numericHeaderStyles}>Occ.</TableCell>
              <TableCell sx={numericHeaderStyles}>Tariff</TableCell>
              <TableCell>No. Of Rooms</TableCell>
              <TableCell sx={numericHeaderStyles}>Total Taxable Amount</TableCell>
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
              <TableCell sx={highlightLabelCellStyles}>Total Charges</TableCell>
              <TableCell sx={highlightNumericCellStyles}>
                {formatQuotationRupeeAmount(accommodation?.totalCharges ?? 0)}
              </TableCell>
            </TableRow>
            {discountRows}
          </TableBody>
        </Table>
      </Box>

      {eventDetailsByDateSections}

      <Box sx={totalCostSummarySectionStyles}>
        <SectionHeading>Total Cost Summary</SectionHeading>
        <Table sx={tableStyles} aria-label="Total Cost Summary">
          <TableHead>
            <TableRow>
              <TableCell>Particulars</TableCell>
              <TableCell>Description</TableCell>
              <TableCell sx={numericHeaderStyles}>Pax</TableCell>
              <TableCell sx={numericHeaderStyles}>Cost Per Plate</TableCell>
              <TableCell sx={numericHeaderStyles}>Total Cost</TableCell>
              <TableCell sx={numericHeaderStyles}>GST {foodGstRatePercent}%</TableCell>
              <TableCell sx={numericHeaderStyles}>Total Cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {totalCostSummaryRows}
            <TableRow>
              <TableCell sx={highlightLabelCellStyles}>Food Cost</TableCell>
              <TableCell sx={highlightLabelCellStyles} />
              <TableCell sx={highlightLabelCellStyles} />
              <TableCell sx={highlightLabelCellStyles} />
              <TableCell sx={highlightNumericCellStyles}>{totals.foodCostTotal}</TableCell>
              <TableCell sx={highlightNumericCellStyles}>{totals.foodGst}</TableCell>
              <TableCell sx={highlightNumericCellStyles}>
                {formatQuotationRupeeAmount(totals.foodCostWithGst)}
              </TableCell>
            </TableRow>
            {/* D2: the Final Amount, its 5% GST, and their sum. */}
            <TableRow>
              <TableCell sx={rowLabelCellStyles}>Accommodation</TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell sx={numericCellStyles}>{totals.accommodation.taxable}</TableCell>
              <TableCell sx={numericCellStyles}>{totals.accommodation.gst}</TableCell>
              <TableCell sx={numericCellStyles}>{formatQuotationRupeeAmount(totals.accommodation.total)}</TableCell>
            </TableRow>
            {extraLineItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell sx={rowLabelCellStyles}>{item.name}</TableCell>
                <TableCell colSpan={5} sx={mergedDescriptionCellStyles}>
                  {item.note ?? ''}
                </TableCell>
                <TableCell sx={numericCellStyles}>{formatQuotationRupeeAmount(item.amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell sx={highlightLabelCellStyles}>Grand Total</TableCell>
              <TableCell sx={highlightLabelCellStyles} />
              <TableCell sx={highlightLabelCellStyles} />
              <TableCell sx={highlightNumericCellStyles}>{formatQuotationRupees(totals.grandTotal)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>

      {/* The static footer (SRS FR-QUO-10): fixed constants, not editable
          from any screen. */}
      <Box sx={sectionStyles}>
        <SectionHeading>Terms & Conditions</SectionHeading>
        <Box component="ul" sx={bulletedListStyles} aria-label="Terms & Conditions">
          {TERMS_AND_CONDITIONS.map((term, index) => (
            <li key={index}>
              {term.strong && <strong>{term.strong}</strong>}
              {term.text}
            </li>
          ))}
        </Box>
      </Box>

      <Box sx={documentsAndBankStyles}>
        <Box sx={sectionStyles}>
          <SectionHeading>Documents Required from Bride and Groom</SectionHeading>
          <Box component="ol" sx={numberedListStyles} aria-label="Documents Required from Bride and Groom">
            {DOCUMENTS_REQUIRED.map((document, index) => (
              <li key={index}>{document}</li>
            ))}
          </Box>
        </Box>
        <Box sx={sectionStyles}>
          <SectionHeading>Bank Account Details</SectionHeading>
          <Table sx={tableStyles} aria-label="Bank Account Details">
            <TableBody>
              {BANK_ACCOUNT_DETAILS.map(([label, value]) => (
                <TableRow key={label}>
                  <TableCell sx={bankLabelCellStyles}>{label}</TableCell>
                  <TableCell>{value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={closingStyles}>
            <Typography component="p" sx={closingLineStyles}>
              Regards
            </Typography>
            <Typography component="p" sx={closingNameStyles}>
              Aaradhya Banquets
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default QuotationDocument;
