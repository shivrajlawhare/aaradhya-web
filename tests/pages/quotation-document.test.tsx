import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { describe, expect, it } from 'vitest';
import QuotationDocument, {
  type QuotationDocumentAccommodation,
  type QuotationDocumentClientContact,
  type QuotationDocumentManualLineItem,
  type QuotationDocumentSession,
  type QuotationDocumentSessionItem,
} from '../../src/pages/quotation-preview/quotation-document';
import { ClientContactRole, ItemType, SessionStatus } from '../../src/contract';
import { theme } from '../../src/theme/theme';

interface RenderOptions {
  clientContacts?: QuotationDocumentClientContact[];
  sessions?: QuotationDocumentSession[];
  accommodation?: QuotationDocumentAccommodation | undefined;
  extraLineItems?: QuotationDocumentManualLineItem[];
  foodGstRatePercent?: number | undefined;
  // Local-time Date construction (year, 0-indexed month, day) rather than a
  // UTC-midnight ISO string — formatQuotationGenerationDate reads local
  // calendar getters (getDate/getMonth/getFullYear), same as the real
  // "today" it formats at actual generation time; an ISO 'Z' string would
  // make this test's own expected day depend on the runner's timezone.
  quotationDate?: Date;
}

const bride = (overrides: Partial<QuotationDocumentClientContact> = {}): QuotationDocumentClientContact => ({
  name: 'Sneha Bhaskar Vaidya',
  contactNumber: '9850053586',
  role: ClientContactRole.Bride,
  ...overrides,
});

const renderDocument = ({
  clientContacts = [bride()],
  sessions = [],
  accommodation = undefined,
  extraLineItems = [],
  foodGstRatePercent = 5,
  quotationDate = new Date(2026, 7, 23),
}: RenderOptions = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <QuotationDocument
        clientContacts={clientContacts}
        sessions={sessions}
        accommodation={accommodation}
        extraLineItems={extraLineItems}
        foodGstRatePercent={foodGstRatePercent}
        quotationDate={quotationDate}
      />
    </ThemeProvider>,
  );

const makeManualLineItem = (
  overrides: Partial<QuotationDocumentManualLineItem> = {},
): QuotationDocumentManualLineItem => ({
  name: 'Decoration',
  note: null,
  amount: 0,
  ...overrides,
});

const makeSession = (overrides: Partial<QuotationDocumentSession> = {}): QuotationDocumentSession => ({
  id: 'session-1',
  sessionType: 'Engagement',
  venue: 'Poolside',
  venueCost: 60000,
  startDate: '2026-12-10T00:00:00.000Z',
  startTime: '18:00',
  endTime: '22:00',
  pax: 30,
  sessionStatus: SessionStatus.Active,
  items: [],
  ...overrides,
});

const makeMealItem = (overrides: Partial<QuotationDocumentSessionItem> = {}): QuotationDocumentSessionItem => ({
  id: 'meal-item-1',
  type: ItemType.Meal,
  mealName: 'Hi Tea snacks - poolside',
  pax: 30,
  costPerPlate: 275,
  limitedSeating: false,
  eventName: null,
  venue: null,
  startTime: '18:00',
  endTime: '19:00',
  menuItemNames: ['Tea', 'Coffee'],
  ...overrides,
});

const makeCeremonyItem = (overrides: Partial<QuotationDocumentSessionItem> = {}): QuotationDocumentSessionItem => ({
  id: 'ceremony-item-1',
  type: ItemType.Event,
  mealName: null,
  pax: null,
  costPerPlate: null,
  limitedSeating: null,
  eventName: 'Muhurta',
  venue: null,
  startTime: null,
  endTime: null,
  menuItemNames: [],
  ...overrides,
});

const makeRoomLine = (
  overrides: Partial<QuotationDocumentAccommodation['roomLines'][number]> = {},
): QuotationDocumentAccommodation['roomLines'][number] => ({
  roomType: 'Delux',
  occupancy: 2,
  tariff: 2500,
  noOfRooms: 14,
  totalInclGst: 73500,
  ...overrides,
});

const makeAccommodation = (overrides: Partial<QuotationDocumentAccommodation> = {}): QuotationDocumentAccommodation => ({
  checkIn: '2026-12-10T00:00:00.000Z',
  checkOut: '2026-12-12T00:00:00.000Z',
  totalDays: 2,
  roomLines: [],
  totalOccupancy: 0,
  totalCharges: 0,
  ...overrides,
});

describe('QuotationDocument', () => {
  it('renders the header, title row, and generation date exactly as the reference PDFs do', () => {
    renderDocument({ sessions: [makeSession()], quotationDate: new Date(2026, 7, 23) });

    expect(screen.getByAltText('Aaradhya')).toBeInTheDocument();
    expect(screen.getByAltText('Aaradhya — A Complete Destination')).toBeInTheDocument();
    expect(screen.getByText('GST No.: 27ABLFA0695F1ZC', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('+91 9423362122', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Event Quotation' })).toBeInTheDocument();
    // 23/08/2026 — FR-QUO-6: always the render-time date, DD/MM/YYYY.
    expect(screen.getByText('Quotation Date: 23/08/2026')).toBeInTheDocument();
  });

  it('renders exactly the rows in client_contacts[], in entry order, including a blank-Bride/Groom row (example_quatation_2.pdf)', () => {
    renderDocument({
      clientContacts: [
        { name: '', contactNumber: '', role: ClientContactRole.Bride },
        { name: '', contactNumber: '', role: ClientContactRole.Groom },
        { name: 'Mr. Saish Rege', contactNumber: '7875023468', role: ClientContactRole.POC },
      ],
    });

    const clientDetailsTable = screen.getByRole('table', { name: 'Client Details' });
    const rows = within(clientDetailsTable).getAllByRole('row');
    // Header row + 3 data rows — the blank Bride/Groom rows are still
    // present, not omitted, per this story's own edge case.
    expect(rows).toHaveLength(4);
    expect(within(rows[1]!).getByText('Bride')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Groom')).toBeInTheDocument();
    expect(within(rows[3]!).getByText('Point of Contact')).toBeInTheDocument();
    expect(within(rows[3]!).getByText('Mr. Saish Rege')).toBeInTheDocument();
    expect(within(rows[3]!).getByText('7875023468')).toBeInTheDocument();
  });

  it('renders a Client Contact with only the Contact Number filled (Name left blank)', () => {
    renderDocument({ clientContacts: [{ name: '', contactNumber: '9998887777', role: ClientContactRole.POC }] });

    const clientDetailsTable = screen.getByRole('table', { name: 'Client Details' });
    const rows = within(clientDetailsTable).getAllByRole('row');
    expect(rows).toHaveLength(2);
    expect(within(rows[1]!).getByText('Point of Contact')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('9998887777')).toBeInTheDocument();
  });

  it('renders one Event Details row per Session, formatted exactly like example_quatation_1.pdf', () => {
    renderDocument({
      sessions: [
        makeSession({
          id: 'engagement',
          sessionType: 'Engagement',
          venue: 'Poolside',
          venueCost: 60000,
          startDate: '2026-12-10T00:00:00.000Z',
          startTime: '18:00',
          endTime: '22:00',
          pax: 30,
        }),
        makeSession({
          id: 'wedding',
          sessionType: 'Wedding',
          venue: 'Full Banquet',
          venueCost: 120000,
          startDate: '2026-12-11T00:00:00.000Z',
          startTime: '09:00',
          endTime: '15:00',
          pax: 300,
        }),
      ],
    });

    expect(screen.getByText('10/12/2026')).toBeInTheDocument();
    expect(screen.getByText('6pm to 10pm')).toBeInTheDocument();
    expect(screen.getByText('60,000/-')).toBeInTheDocument();
    expect(screen.getByText('11/12/2026')).toBeInTheDocument();
    expect(screen.getByText('9am to 3pm')).toBeInTheDocument();
    expect(screen.getByText('1,20,000/-')).toBeInTheDocument();
  });

  it('renders two Sessions on the same date as two separate rows, never merged (example_quatation_2.pdf: Halad+Engagement)', () => {
    renderDocument({
      sessions: [
        makeSession({ id: 'halad', sessionType: 'Halad', venue: 'Half Banquet', startDate: '2027-02-26T00:00:00.000Z' }),
        makeSession({ id: 'engagement', sessionType: 'Engagement', venue: 'Poolside', startDate: '2027-02-26T00:00:00.000Z' }),
      ],
    });

    const eventDetailsTable = screen.getByRole('table', { name: 'Event Details' });
    const rows = within(eventDetailsTable).getAllByRole('row');
    // Header row + 2 data rows, not merged into one.
    expect(rows).toHaveLength(3);
    expect(within(rows[1]!).getByText('Halad')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Engagement')).toBeInTheDocument();
  });

  it('renders a single Session with full-width column headers, not a degenerate layout', () => {
    renderDocument({ sessions: [makeSession()] });

    const eventDetailsTable = screen.getByRole('table', { name: 'Event Details' });
    expect(within(eventDetailsTable).getByRole('columnheader', { name: 'Event Type' })).toBeInTheDocument();
    expect(within(eventDetailsTable).getByRole('columnheader', { name: 'Event Date' })).toBeInTheDocument();
    expect(within(eventDetailsTable).getByRole('columnheader', { name: 'Event Duration' })).toBeInTheDocument();
    expect(within(eventDetailsTable).getByRole('columnheader', { name: 'No. Of Guests' })).toBeInTheDocument();
    expect(within(eventDetailsTable).getByRole('columnheader', { name: 'Venue Selected' })).toBeInTheDocument();
    expect(within(eventDetailsTable).getByRole('columnheader', { name: 'Selected Venue Cost' })).toBeInTheDocument();
    const rows = within(eventDetailsTable).getAllByRole('row');
    expect(rows).toHaveLength(2);
  });

  it('excludes a Cancelled Session from the Event Details table', () => {
    renderDocument({ sessions: [makeSession({ sessionStatus: SessionStatus.Cancelled })] });

    expect(screen.getByText('No Sessions yet.')).toBeInTheDocument();
    expect(screen.queryByText('Engagement')).not.toBeInTheDocument();
  });

  it('renders Accommodation Details exactly like example_quatation_1.pdf: Extra Beds last, merged Check-in/Check-out/Total Days, green/amber footer', () => {
    renderDocument({
      accommodation: makeAccommodation({
        roomLines: [
          makeRoomLine({ roomType: 'Delux', occupancy: 2, tariff: 2500, noOfRooms: 14, totalInclGst: 73500 }),
          makeRoomLine({ roomType: 'Executive', occupancy: 3, tariff: 3500, noOfRooms: 2, totalInclGst: 14700 }),
          makeRoomLine({ roomType: 'Dormatory', occupancy: 6, tariff: 5000, noOfRooms: 2, totalInclGst: 21000 }),
          makeRoomLine({ roomType: 'Extra Beds', occupancy: 0, tariff: 700, noOfRooms: 0, totalInclGst: 0 }),
        ],
        totalOccupancy: 46,
        totalCharges: 109200,
      }),
    });

    const table = screen.getByRole('table', { name: 'Accommodation Details' });
    const rows = within(table).getAllByRole('row');
    // Header + 4 Room Line rows + 1 footer row.
    expect(rows).toHaveLength(6);

    // Check-in/Check-out/Total Days merged (rowSpan) across all 4 Room
    // Line rows, not repeated on each one.
    const checkInCell = within(rows[1]!).getAllByRole('cell')[0]!;
    expect(checkInCell).toHaveAttribute('rowspan', '4');
    expect(checkInCell.textContent).toContain('10-12-2026');
    expect(checkInCell.textContent).toContain('12pm');
    const checkOutCell = within(rows[1]!).getAllByRole('cell')[1]!;
    expect(checkOutCell).toHaveAttribute('rowspan', '4');
    expect(checkOutCell.textContent).toContain('12-12-2026');
    expect(checkOutCell.textContent).toContain('11am');
    const totalDaysCell = within(rows[1]!).getAllByRole('cell')[2]!;
    expect(totalDaysCell).toHaveAttribute('rowspan', '4');
    expect(totalDaysCell.textContent).toBe('2');

    // Row 2 onward only has the 5 Room Line columns — the merged cells
    // above account for the rest.
    expect(within(rows[2]!).getAllByRole('cell')).toHaveLength(5);
    expect(within(rows[2]!).getByText('Executive')).toBeInTheDocument();

    // Extra Beds always last, even though it's a regular Room Line entry
    // like any other (roomType === 'Extra Beds' is the only signal) —
    // prints even with every numeric field at zero.
    const extraBedsCells = within(rows[4]!).getAllByRole('cell');
    expect(extraBedsCells.map((cell) => cell.textContent)).toEqual(['Extra Beds', '0', '700', '0', '0']);

    // Footer row: green Total Occ., amber Total Charges.
    const footerCells = within(rows[5]!).getAllByRole('cell');
    expect(footerCells[3]!.textContent).toBe('Total Occ.');
    expect(footerCells[4]!.textContent).toBe('46');
    expect(footerCells[4]!).toHaveStyle({ backgroundColor: 'rgb(169, 209, 142)' });
    expect(footerCells[6]!.textContent).toBe('Total Charges');
    expect(footerCells[7]!.textContent).toBe('Rs. 1,09,200 /-');
    expect(footerCells[7]!).toHaveStyle({ backgroundColor: 'rgb(255, 217, 102)' });
  });

  it('reorders custom Room Types before Extra Beds even when Extra Beds appears earlier in the raw stored order', () => {
    renderDocument({
      accommodation: makeAccommodation({
        roomLines: [
          makeRoomLine({ roomType: 'Extra Beds', occupancy: 0, tariff: 700, noOfRooms: 0, totalInclGst: 0 }),
          makeRoomLine({ roomType: 'Delux', occupancy: 2, tariff: 2500, noOfRooms: 14, totalInclGst: 73500 }),
        ],
      }),
    });

    const table = screen.getByRole('table', { name: 'Accommodation Details' });
    const rows = within(table).getAllByRole('row');
    expect(within(rows[1]!).getByText('Delux')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Extra Beds')).toBeInTheDocument();
  });

  it('still renders full column headers and a zero footer for an Accommodation Block with zero Room Lines at all', () => {
    renderDocument({ accommodation: makeAccommodation({ checkIn: null, checkOut: null, totalDays: null, roomLines: [] }) });

    const table = screen.getByRole('table', { name: 'Accommodation Details' });
    expect(within(table).getByRole('columnheader', { name: 'Room Type' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Total including GST' })).toBeInTheDocument();
    const rows = within(table).getAllByRole('row');
    // Header + 1 placeholder row + footer.
    expect(rows).toHaveLength(3);
    expect(within(rows[2]!).getByText('0')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Rs. 0 /-')).toBeInTheDocument();
  });

  it('treats a fully-absent accommodation block the same as an empty one, without crashing', () => {
    renderDocument({ accommodation: undefined });

    const table = screen.getByRole('table', { name: 'Accommodation Details' });
    expect(within(table).getByText('Rs. 0 /-')).toBeInTheDocument();
  });

  describe('per-date Event Details tables (STORY-071)', () => {
    it('renders one table per distinct date, in date order, headed "Event Details – DD/MM/YYYY"', () => {
      renderDocument({
        sessions: [
          makeSession({
            id: 'wedding',
            sessionType: 'Wedding',
            startDate: '2026-12-11T00:00:00.000Z',
            items: [makeMealItem({ id: 'breakfast', mealName: 'Breakfast' })],
          }),
          makeSession({
            id: 'engagement',
            sessionType: 'Engagement',
            startDate: '2026-12-10T00:00:00.000Z',
            items: [makeMealItem({ id: 'hitea', mealName: 'Hi Tea snacks - poolside' })],
          }),
        ],
      });

      const headings = screen.getAllByRole('heading', { level: 2 });
      const dateHeadings = headings.filter((heading) => heading.textContent?.startsWith('Event Details –'));
      // Date order (10/12 before 11/12), not Session entry order (Wedding
      // was listed first above).
      expect(dateHeadings.map((heading) => heading.textContent)).toEqual([
        'Event Details – 10/12/2026',
        'Event Details – 11/12/2026',
      ]);
      expect(screen.getByRole('table', { name: 'Event Details – 10/12/2026' })).toBeInTheDocument();
      expect(screen.getByRole('table', { name: 'Event Details – 11/12/2026' })).toBeInTheDocument();
    });

    it('forces every per-date table onto its own page in the generated PDF, including the first (nothing after Accommodation Details shares page 1)', () => {
      renderDocument({
        sessions: [
          makeSession({
            id: 'engagement',
            startDate: '2026-12-10T00:00:00.000Z',
            items: [makeMealItem({ id: 'hitea', mealName: 'Hi Tea' })],
          }),
          makeSession({
            id: 'wedding',
            startDate: '2026-12-11T00:00:00.000Z',
            items: [makeMealItem({ id: 'breakfast', mealName: 'Breakfast' })],
          }),
        ],
      });

      const headings = screen.getAllByRole('heading', { level: 2 });
      const dateHeadings = headings.filter((heading) => heading.textContent?.startsWith('Event Details –'));
      expect(dateHeadings).toHaveLength(2);
      for (const heading of dateHeadings) {
        // Walks up to the section's own outer Box — the heading itself
        // isn't what carries the break style.
        const section = heading.closest('div')!;
        expect(section).toHaveStyle({ breakBefore: 'page' });
      }
    });

    it('renders a Food/Dining row exactly like example_quatation_1.pdf\'s own "Hi Tea" row', () => {
      renderDocument({
        sessions: [
          makeSession({
            startDate: '2026-12-10T00:00:00.000Z',
            items: [
              makeMealItem({
                mealName: 'Hi Tea snacks - poolside',
                startTime: '18:00',
                endTime: '19:00',
                pax: 30,
                costPerPlate: 275,
                limitedSeating: false,
                menuItemNames: ['Tea', 'Coffee', 'Cold Drinks - black', 'Onion Pakoda', 'Veg Sandwich', 'Biscuits'],
              }),
            ],
          }),
        ],
      });

      const table = screen.getByRole('table', { name: 'Event Details – 10/12/2026' });
      const row = within(table).getAllByRole('row')[1]!;
      const cells = within(row).getAllByRole('cell');
      expect(cells[0]!.textContent).toBe('Hi Tea snacks - poolside');
      expect(cells[1]!.textContent).toBe('6pm to 7pm');
      expect(cells[2]!.textContent).toBe('30');
      // Ungrouped, not '275/-' formatted with Indian digit grouping — same
      // "bare number" convention a Room Line's own Tariff cell already
      // established (STORY-070), just with a trailing "/-".
      expect(cells[3]!.textContent).toBe('275/-');
      expect(cells[4]!.textContent).toBe('1. Tea2. Coffee3. Cold Drinks - black4. Onion Pakoda5. Veg Sandwich6. Biscuits');
    });

    it('renders Number of Pax as "L.S. (Npax)" when limitedSeating is set (FR-QUO-8)', () => {
      renderDocument({
        sessions: [
          makeSession({
            startDate: '2026-12-11T00:00:00.000Z',
            items: [makeMealItem({ mealName: 'Chaat Counter', pax: 300, limitedSeating: true, costPerPlate: 45000 })],
          }),
        ],
      });

      const table = screen.getByRole('table', { name: 'Event Details – 11/12/2026' });
      expect(within(table).getByText('L.S. (300pax)')).toBeInTheDocument();
      // A 5-digit Cost still prints bare, no comma grouping (example_
      // quatation_1.pdf's own "Chaat Counter" row: "45000/-").
      expect(within(table).getByText('45000/-')).toBeInTheDocument();
    });

    it('renders a Food/Dining row with a blank Time when the Item\'s own time fields are blank', () => {
      renderDocument({
        sessions: [
          makeSession({
            startDate: '2026-12-11T00:00:00.000Z',
            items: [makeMealItem({ mealName: 'Starter', startTime: null, endTime: null, menuItemNames: [] })],
          }),
        ],
      });

      const table = screen.getByRole('table', { name: 'Event Details – 11/12/2026' });
      const row = within(table).getAllByRole('row')[1]!;
      const cells = within(row).getAllByRole('cell');
      expect(cells[1]!.textContent).toBe('');
      expect(cells[4]!.textContent).toBe('');
    });

    it('renders a Ceremony row merged across all 5 columns, shaded grey, with venue appended (no time)', () => {
      renderDocument({
        sessions: [
          makeSession({
            startDate: '2026-12-10T00:00:00.000Z',
            items: [makeCeremonyItem({ eventName: 'Engagement Sangeet', venue: 'Poolside', startTime: null, endTime: null })],
          }),
        ],
      });

      const table = screen.getByRole('table', { name: 'Event Details – 10/12/2026' });
      const row = within(table).getAllByRole('row')[1]!;
      const cell = within(row).getAllByRole('cell')[0]!;
      expect(cell).toHaveAttribute('colspan', '5');
      expect(cell.textContent).toBe('Engagement Sangeet - Poolside');
      expect(cell).toHaveStyle({ backgroundColor: 'rgb(217, 217, 217)' });
    });

    it('renders a Ceremony row with time appended (no venue)', () => {
      renderDocument({
        sessions: [
          makeSession({
            startDate: '2026-12-11T00:00:00.000Z',
            items: [makeCeremonyItem({ eventName: 'Muhurta', venue: null, startTime: '11:00', endTime: '12:30' })],
          }),
        ],
      });

      const table = screen.getByRole('table', { name: 'Event Details – 11/12/2026' });
      const cell = within(table).getAllByRole('row')[1]!.querySelector('td')!;
      expect(cell.textContent).toBe('Muhurta 11am to 12:30pm');
    });

    it('renders a bare Ceremony row (name only, neither time nor venue set)', () => {
      renderDocument({
        sessions: [
          makeSession({
            startDate: '2027-02-27T00:00:00.000Z',
            items: [makeCeremonyItem({ eventName: 'Muhurta', venue: null, startTime: null, endTime: null })],
          }),
        ],
      });

      const table = screen.getByRole('table', { name: 'Event Details – 27/02/2027' });
      const cell = within(table).getAllByRole('row')[1]!.querySelector('td')!;
      expect(cell.textContent).toBe('Muhurta');
    });

    it('renders a wholly-blank Ceremony divider row (example_quatation_2.pdf), not filtered out', () => {
      renderDocument({
        sessions: [
          makeSession({
            startDate: '2027-02-26T00:00:00.000Z',
            items: [
              makeMealItem({ id: 'hitea', mealName: 'Hi Tea' }),
              makeCeremonyItem({ id: 'blank', eventName: null, venue: null, startTime: null, endTime: null }),
              makeMealItem({ id: 'dinner', mealName: 'Dinner - Poolside' }),
            ],
          }),
        ],
      });

      const table = screen.getByRole('table', { name: 'Event Details – 26/02/2027' });
      const rows = within(table).getAllByRole('row');
      // Header + 3 Item rows (Meal, blank Ceremony, Meal) — the blank row
      // is a real, rendered row, not silently dropped.
      expect(rows).toHaveLength(4);
      const blankRowCell = within(rows[2]!).getAllByRole('cell')[0]!;
      expect(blankRowCell).toHaveAttribute('colspan', '5');
      expect(blankRowCell.textContent).toBe('');
    });

    it('pools two Sessions sharing a date into one table, interleaving Items in Session-then-own-item order (example_quatation_2.pdf: Halad+Engagement)', () => {
      renderDocument({
        sessions: [
          makeSession({
            id: 'halad',
            sessionType: 'Halad',
            startDate: '2027-02-26T00:00:00.000Z',
            items: [
              makeMealItem({ id: 'breakfast', mealName: 'Breakfast' }),
              makeCeremonyItem({ id: 'haldi-event', eventName: 'Haldi Event' }),
            ],
          }),
          makeSession({
            id: 'engagement',
            sessionType: 'Engagement',
            startDate: '2027-02-26T00:00:00.000Z',
            items: [
              makeMealItem({ id: 'hitea', mealName: 'Hi Tea' }),
              makeMealItem({ id: 'dinner', mealName: 'Dinner - Poolside' }),
            ],
          }),
        ],
      });

      // One table for the shared date, not two.
      expect(screen.getAllByRole('table', { name: 'Event Details – 26/02/2027' })).toHaveLength(1);
      const table = screen.getByRole('table', { name: 'Event Details – 26/02/2027' });
      const rows = within(table).getAllByRole('row');
      // Header + 4 Item rows, Halad's own two first, then Engagement's own two.
      expect(rows).toHaveLength(5);
      expect(within(rows[1]!).getByText('Breakfast')).toBeInTheDocument();
      expect(within(rows[2]!).getByText('Haldi Event')).toBeInTheDocument();
      expect(within(rows[3]!).getByText('Hi Tea')).toBeInTheDocument();
      expect(within(rows[4]!).getByText('Dinner - Poolside')).toBeInTheDocument();
    });

    it('still renders a valid table with headers for a date with only Ceremony rows and zero Food/Dining rows', () => {
      renderDocument({
        sessions: [
          makeSession({
            startDate: '2026-12-10T00:00:00.000Z',
            items: [makeCeremonyItem({ eventName: 'Muhurta' })],
          }),
        ],
      });

      const table = screen.getByRole('table', { name: 'Event Details – 10/12/2026' });
      expect(within(table).getByRole('columnheader', { name: 'Time' })).toBeInTheDocument();
      expect(within(table).getByRole('columnheader', { name: 'Number of Pax' })).toBeInTheDocument();
      expect(within(table).getByRole('columnheader', { name: 'Cost' })).toBeInTheDocument();
      expect(within(table).getByRole('columnheader', { name: 'Menu' })).toBeInTheDocument();
      expect(within(table).getAllByRole('row')).toHaveLength(2);
    });

    it('does not truncate a long Menu list (example_quatation_1.pdf\'s own 16-item Dinner menu)', () => {
      const sixteenItemMenu = [
        'Veg Manchow Soup',
        'Veg Manchurian',
        'Paneer Tikka',
        'Jeera Rice',
        'Dal Fry',
        'Veg Kolhapuri',
        'Paneer Bhurji',
        'Tandoori Roti',
        'Fulke',
        'Butter on the side',
        'Peanut Salad',
        'Veg Raita',
        'Green Salad',
        'Rabdi Jalebi',
        'Gulabjamun',
        'Kulfi',
      ];
      renderDocument({
        sessions: [
          makeSession({
            startDate: '2026-12-10T00:00:00.000Z',
            items: [makeMealItem({ mealName: 'Dinner - poolside', menuItemNames: sixteenItemMenu })],
          }),
        ],
      });

      const table = screen.getByRole('table', { name: 'Event Details – 10/12/2026' });
      expect(within(table).getByText('1. Veg Manchow Soup')).toBeInTheDocument();
      expect(within(table).getByText('16. Kulfi')).toBeInTheDocument();
    });

    it('excludes a Cancelled Session\'s Items from the per-date tables', () => {
      renderDocument({
        sessions: [
          makeSession({
            startDate: '2026-12-10T00:00:00.000Z',
            sessionStatus: SessionStatus.Cancelled,
            items: [makeMealItem({ mealName: 'Cancelled Lunch' })],
          }),
        ],
      });

      expect(screen.queryByText('Cancelled Lunch')).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /Event Details –/ })).not.toBeInTheDocument();
    });
  });

  describe('Total Cost Summary (STORY-072)', () => {
    it('renders one venue row per Session on a shared date, both merged under one date-block label (example_quatation_2.pdf: Halad+Engagement)', () => {
      renderDocument({
        sessions: [
          makeSession({
            id: 'halad',
            sessionType: 'Halad',
            venue: 'Half Banquet',
            venueCost: 60000,
            startDate: '2027-02-26T00:00:00.000Z',
            items: [],
          }),
          makeSession({
            id: 'engagement',
            sessionType: 'Engagement',
            venue: 'Poolside',
            venueCost: 60000,
            startDate: '2027-02-26T00:00:00.000Z',
            items: [],
          }),
        ],
      });

      const table = screen.getByRole('table', { name: 'Total Cost Summary' });
      const rows = within(table).getAllByRole('row');
      // Header + 2 venue rows + Food Cost + Accommodation + Grand Total.
      expect(rows).toHaveLength(6);

      const halfBanquetRow = within(rows[1]!).getAllByRole('cell');
      expect(halfBanquetRow[0]!.textContent).toBe('Wedding Venue and Catering – 26/02/2027');
      expect(halfBanquetRow[0]!).toHaveAttribute('rowspan', '2');
      expect(halfBanquetRow[1]!.textContent).toBe('Half Banquet');
      expect(halfBanquetRow[5]!.textContent).toBe('60000');

      // Second venue row has no Cost Item cell of its own — the merged
      // cell above accounts for it, same rowSpan pattern Accommodation
      // Details' own Check-in/Check-out cells already establish.
      const poolsideRow = within(rows[2]!).getAllByRole('cell');
      expect(poolsideRow).toHaveLength(5);
      expect(poolsideRow[0]!.textContent).toBe('Poolside');
      expect(poolsideRow[4]!.textContent).toBe('60000');
    });

    it('bills a limited-seating Meal Item\'s Total Cost at pax=1, not the literal headcount (FR-QUO-8)', () => {
      renderDocument({
        sessions: [
          makeSession({
            startDate: '2026-12-11T00:00:00.000Z',
            venue: 'Full Banquet',
            venueCost: 0,
            items: [makeMealItem({ mealName: 'Chaat Counter', pax: 300, limitedSeating: true, costPerPlate: 45000 })],
          }),
        ],
      });

      const table = screen.getByRole('table', { name: 'Total Cost Summary' });
      // Venue row (pax 0) then the food row — food row is rows[2]. No
      // merged Cost Item cell of its own (the venue row above already
      // rendered it), so this row has 5 cells, not 6.
      const foodRow = within(table).getAllByRole('row')[2]!;
      const cells = within(foodRow).getAllByRole('cell');
      expect(cells[0]!.textContent).toBe('Chaat Counter');
      expect(cells[1]!.textContent).toBe('1');
      expect(cells[2]!.textContent).toBe('45000');
      // Total Cost = 1 × 45000 = 45000, matching example_quatation_1.pdf's
      // own printed figure for this exact row.
      expect(cells[3]!.textContent).toBe('45000');
      expect(cells[4]!.textContent).toBe('');
    });

    it('renders a Meal Item genuinely entered with pax/cost 0 as a real 0 row, not hidden (example_quatation_1.pdf\'s own blank/zero row)', () => {
      renderDocument({
        sessions: [
          makeSession({
            startDate: '2026-12-10T00:00:00.000Z',
            venueCost: 0,
            items: [makeMealItem({ mealName: '', pax: 0, costPerPlate: 0, limitedSeating: false })],
          }),
        ],
      });

      const table = screen.getByRole('table', { name: 'Total Cost Summary' });
      const foodRow = within(table).getAllByRole('row')[2]!;
      const cells = within(foodRow).getAllByRole('cell');
      expect(cells[1]!.textContent).toBe('0');
      expect(cells[2]!.textContent).toBe('0');
      expect(cells[3]!.textContent).toBe('0');
    });

    it('renders exactly one Food Cost row for the whole table, summed across every date, shaded amber', () => {
      renderDocument({
        sessions: [
          makeSession({
            id: 'engagement',
            startDate: '2026-12-10T00:00:00.000Z',
            venueCost: 0,
            items: [makeMealItem({ mealName: 'Hi Tea', pax: 30, costPerPlate: 275 })],
          }),
          makeSession({
            id: 'wedding',
            startDate: '2026-12-11T00:00:00.000Z',
            venueCost: 0,
            items: [makeMealItem({ mealName: 'Breakfast', pax: 50, costPerPlate: 350 })],
          }),
        ],
        foodGstRatePercent: 5,
      });

      const table = screen.getByRole('table', { name: 'Total Cost Summary' });
      // Exactly one "Food Cost" cell — no per-date subtotal (this story's
      // own explicit non-goal).
      expect(within(table).getAllByText('Food Cost')).toHaveLength(1);
      const foodCostRow = within(table).getByText('Food Cost').closest('tr')!;
      const cells = within(foodCostRow).getAllByRole('cell');
      // 30×275 + 50×350 = 8250 + 17500 = 25750; ×1.05 = 27037.5.
      expect(cells[4]!.textContent).toBe('25750');
      expect(cells[5]!.textContent).toBe('27037.5');
      expect(cells[0]!).toHaveStyle({ backgroundColor: 'rgb(255, 217, 102)' });
      expect(cells[5]!).toHaveStyle({ backgroundColor: 'rgb(255, 217, 102)' });
    });

    it('uses a custom foodGstRatePercent instead of the 5% default (SRS §4.9)', () => {
      renderDocument({
        sessions: [
          makeSession({
            startDate: '2026-12-10T00:00:00.000Z',
            venueCost: 0,
            items: [makeMealItem({ mealName: 'Hi Tea', pax: 10, costPerPlate: 100 })],
          }),
        ],
        foodGstRatePercent: 18,
      });

      const table = screen.getByRole('table', { name: 'Total Cost Summary' });
      const foodCostRow = within(table).getByText('Food Cost').closest('tr')!;
      // 10×100 = 1000; ×1.18 = 1180, not the 5%-default 1050.
      expect(within(foodCostRow).getByText('1180')).toBeInTheDocument();
    });

    it('renders an Accommodation row with only Total Cost with GST populated', () => {
      renderDocument({
        accommodation: makeAccommodation({ totalCharges: 109200 }),
      });

      const table = screen.getByRole('table', { name: 'Total Cost Summary' });
      const accommodationRow = within(table).getByText('Accommodation').closest('tr')!;
      const cells = within(accommodationRow).getAllByRole('cell');
      expect(cells.map((cell) => cell.textContent)).toEqual(['Accommodation', '', '', '', '', '109200']);
    });

    it('renders manual line items with name/note/amount, blank note when absent (STORY-068)', () => {
      renderDocument({
        extraLineItems: [
          makeManualLineItem({
            name: 'Decoration',
            note: 'poolside engg sangeet + Wedding(Vidhi mandap with saptapadi)',
            amount: 150000,
          }),
          makeManualLineItem({ name: 'Photographer', note: null, amount: 0 }),
          makeManualLineItem({ name: 'Bhatji', note: 'wedding', amount: 7000 }),
        ],
      });

      const table = screen.getByRole('table', { name: 'Total Cost Summary' });
      const decorationRow = within(table).getByText('Decoration').closest('tr')!;
      expect(
        within(decorationRow).getByText('poolside engg sangeet + Wedding(Vidhi mandap with saptapadi)'),
      ).toBeInTheDocument();
      expect(within(decorationRow).getByText('150000')).toBeInTheDocument();

      const photographerRow = within(table).getByText('Photographer').closest('tr')!;
      const photographerCells = within(photographerRow).getAllByRole('cell');
      expect(photographerCells[1]!.textContent).toBe('');

      const bhatjiRow = within(table).getByText('Bhatji').closest('tr')!;
      expect(within(bhatjiRow).getByText('wedding')).toBeInTheDocument();
      expect(within(bhatjiRow).getByText('7000')).toBeInTheDocument();
    });

    it('renders "Grand Total" in the Cost Per Plate column, shaded amber, summing every category', () => {
      renderDocument({
        sessions: [
          makeSession({
            startDate: '2026-12-10T00:00:00.000Z',
            venue: 'Poolside',
            venueCost: 60000,
            items: [makeMealItem({ mealName: 'Hi Tea', pax: 30, costPerPlate: 275 })],
          }),
        ],
        accommodation: makeAccommodation({ totalCharges: 10000 }),
        extraLineItems: [makeManualLineItem({ name: 'Decoration', note: null, amount: 5000 })],
        foodGstRatePercent: 5,
      });

      const table = screen.getByRole('table', { name: 'Total Cost Summary' });
      const grandTotalRow = within(table).getByText('Grand Total').closest('tr')!;
      const cells = within(grandTotalRow).getAllByRole('cell');
      // "Grand Total" sits in the Cost Per Plate column (index 3), not
      // Cost Item — this story's own literal AC instruction.
      expect(cells[3]!.textContent).toBe('Grand Total');
      // venueTotal 60000 + foodCostWithGst (8250×1.05=8662.5) + accommodation
      // 10000 + manual 5000 = 83662.5, rounded to the nearest rupee for
      // display.
      expect(cells[5]!.textContent).toBe('Rs. 83,663 /-');
      expect(cells[3]!).toHaveStyle({ backgroundColor: 'rgb(255, 217, 102)' });
      expect(cells[5]!).toHaveStyle({ backgroundColor: 'rgb(255, 217, 102)' });
    });

    // Full end-to-end reproduction of example_quatation_1.pdf's own Total
    // Cost Summary — every row and the final Grand Total, verified to the
    // rupee against its printed "Rs. 10,73,208 /-".
    it('reproduces example_quatation_1.pdf\'s exact printed Total Cost Summary figures', () => {
      renderDocument({
        sessions: [
          makeSession({
            id: 'engagement',
            sessionType: 'Engagement',
            venue: 'Poolside',
            venueCost: 60000,
            startDate: '2026-12-10T00:00:00.000Z',
            items: [
              makeMealItem({ id: 'hitea', mealName: 'Hi Tea', pax: 30, costPerPlate: 275 }),
              makeMealItem({ id: 'chaat', mealName: 'Chaat Counter', pax: 30, limitedSeating: true, costPerPlate: 12000 }),
              makeMealItem({ id: 'chai', mealName: 'Chai Tapri', pax: 30, limitedSeating: true, costPerPlate: 5000 }),
              makeMealItem({ id: 'drinks', mealName: 'Drinks', pax: 30, costPerPlate: 80 }),
              makeMealItem({ id: 'cake', mealName: 'Engagement Cake', pax: 30, limitedSeating: true, costPerPlate: 3000 }),
              makeMealItem({ id: 'dinner', mealName: 'Dinner - poolside', pax: 30, costPerPlate: 900 }),
            ],
          }),
          makeSession({
            id: 'wedding',
            sessionType: 'Wedding',
            venue: 'Full Banquet',
            venueCost: 120000,
            startDate: '2026-12-11T00:00:00.000Z',
            items: [
              makeMealItem({ id: 'breakfast', mealName: 'Breakfast', pax: 50, costPerPlate: 350 }),
              makeMealItem({ id: 'starter', mealName: 'Starter', pax: 300, costPerPlate: 180 }),
              makeMealItem({ id: 'chaat2', mealName: 'Chaat Counter', pax: 300, limitedSeating: true, costPerPlate: 45000 }),
              makeMealItem({ id: 'welcome', mealName: 'Welcome Drink', pax: 300, costPerPlate: 210 }),
              makeMealItem({ id: 'lunch', mealName: 'Lunch', pax: 300, costPerPlate: 1200 }),
            ],
          }),
        ],
        accommodation: makeAccommodation({ totalCharges: 109200 }),
        extraLineItems: [
          makeManualLineItem({
            name: 'Decoration',
            note: 'poolside engg sangeet + Wedding(Vidhi mandap with saptapadi)',
            amount: 150000,
          }),
          makeManualLineItem({ name: 'Photographer', note: null, amount: 0 }),
          makeManualLineItem({ name: 'Bhatji', note: 'wedding', amount: 7000 }),
        ],
        foodGstRatePercent: 5,
      });

      const table = screen.getByRole('table', { name: 'Total Cost Summary' });
      const foodCostRow = within(table).getByText('Food Cost').closest('tr')!;
      // Food subtotal: 8250+12000+5000+2400+3000+27000 (poolside) = 57650;
      // +17500+54000+45000+63000+360000 (banquet) = 539500. Combined =
      // 597150 — example_quatation_1.pdf's own printed Food Cost figure.
      expect(within(foodCostRow).getByText('597150')).toBeInTheDocument();
      // 597150 × 1.05 = 627007.5, printed with its exact decimal, unrounded.
      expect(within(foodCostRow).getByText('627007.5')).toBeInTheDocument();

      const grandTotalRow = within(table).getByText('Grand Total').closest('tr')!;
      // venueTotal 180000 + foodCostWithGst 627007.5 + accommodation 109200
      // + manual 157000 = 1073207.5 -> Rs. 10,73,208 /- after rounding.
      expect(within(grandTotalRow).getByText('Rs. 10,73,208 /-')).toBeInTheDocument();
    });
  });

  describe('static footer (STORY-073)', () => {
    it('renders all 13 Terms & Conditions bullets, verbatim and in order, character-for-character against the reference PDFs', () => {
      renderDocument();

      const list = screen.getByRole('list', { name: 'Terms & Conditions' });
      const items = within(list).getAllByRole('listitem');
      expect(items).toHaveLength(13);
      expect(items.map((item) => item.textContent)).toEqual([
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
      ]);
    });

    it('reproduces the reference PDFs’ own literal "₹15,000" text, not aaradhya-api\'s pdfkit-only "Rs. 15,000" workaround', () => {
      renderDocument();

      expect(screen.getByText(/₹15,000 per hour/)).toBeInTheDocument();
      expect(screen.queryByText(/Rs\. 15,000/)).not.toBeInTheDocument();
    });

    it('renders Documents Required from Bride and Groom as a 6-item numbered list, verbatim and in order', () => {
      renderDocument();

      const list = screen.getByRole('list', { name: 'Documents Required from Bride and Groom' });
      const items = within(list).getAllByRole('listitem');
      expect(items.map((item) => item.textContent)).toEqual([
        'Aadhar Card',
        'Pan Card',
        'Leaving / Birth Certificate',
        'Ration Card',
        '2 passport size photos each',
        'Wedding Card',
      ]);
    });

    it('renders Bank Account Details as a 6-row table with the reference PDFs’ own exact values', () => {
      renderDocument();

      const table = screen.getByRole('table', { name: 'Bank Account Details' });
      const rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(6);
      expect(rows.map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent))).toEqual([
        ['Name', 'Aaradhya Adorer'],
        ['Account Number', '142320110000165'],
        ['Bank Name', 'Bank of India'],
        ['Branch Name', 'Talawade'],
        ['IFSC', 'BKID0001423'],
        ['GST Number', '27ABLFA0695F1ZC'],
      ]);
    });

    it('renders "Regards" then "Aaradhya Banquets" as the final closing lines, with no trailing comma', () => {
      renderDocument();

      expect(screen.getByText('Regards')).toBeInTheDocument();
      expect(screen.getByText('Aaradhya Banquets')).toBeInTheDocument();
      expect(screen.queryByText('Regards,')).not.toBeInTheDocument();
    });

    it('renders identically regardless of Event data — no props influence this section', () => {
      const { unmount } = renderDocument({ sessions: [], accommodation: undefined, extraLineItems: [] });
      const emptyEventTerms = within(screen.getByRole('list', { name: 'Terms & Conditions' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent);
      unmount();

      renderDocument({
        sessions: [makeSession({ items: [makeMealItem()] })],
        accommodation: makeAccommodation(),
        extraLineItems: [makeManualLineItem()],
      });
      const populatedEventTerms = within(screen.getByRole('list', { name: 'Terms & Conditions' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent);

      expect(populatedEventTerms).toEqual(emptyEventTerms);
    });
  });
});
