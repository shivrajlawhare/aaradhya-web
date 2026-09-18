import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { describe, expect, it } from 'vitest';
import QuotationDocument, {
  type QuotationDocumentAccommodation,
  type QuotationDocumentClientContact,
  type QuotationDocumentSession,
} from '../../src/pages/quotation-preview/quotation-document';
import { ClientContactRole, SessionStatus } from '../../src/contract';
import { theme } from '../../src/theme/theme';

interface RenderOptions {
  clientContacts?: QuotationDocumentClientContact[];
  sessions?: QuotationDocumentSession[];
  accommodation?: QuotationDocumentAccommodation | undefined;
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
  quotationDate = new Date(2026, 7, 23),
}: RenderOptions = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <QuotationDocument
        clientContacts={clientContacts}
        sessions={sessions}
        accommodation={accommodation}
        quotationDate={quotationDate}
      />
    </ThemeProvider>,
  );

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

    expect(screen.getByText('AARADHYA')).toBeInTheDocument();
    expect(screen.getByText('A COMPLETE DESTINATION')).toBeInTheDocument();
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
});
