import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { describe, expect, it } from 'vitest';
import QuotationDocument, {
  type QuotationDocumentClientContact,
  type QuotationDocumentSession,
} from '../../src/pages/quotation-preview/quotation-document';
import { ClientContactRole, SessionStatus } from '../../src/contract';
import { theme } from '../../src/theme/theme';

// Local-time Date construction (year, 0-indexed month, day) rather than a
// UTC-midnight ISO string — formatQuotationGenerationDate reads local
// calendar getters (getDate/getMonth/getFullYear), same as the real
// "today" it formats at actual generation time; an ISO 'Z' string would
// make this test's own expected day depend on the runner's timezone.
const renderDocument = (
  clientContacts: QuotationDocumentClientContact[],
  sessions: QuotationDocumentSession[],
  quotationDate = new Date(2026, 7, 23),
) =>
  render(
    <ThemeProvider theme={theme}>
      <QuotationDocument clientContacts={clientContacts} sessions={sessions} quotationDate={quotationDate} />
    </ThemeProvider>,
  );

const bride = (overrides: Partial<QuotationDocumentClientContact> = {}): QuotationDocumentClientContact => ({
  name: 'Sneha Bhaskar Vaidya',
  contactNumber: '9850053586',
  role: ClientContactRole.Bride,
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
  ...overrides,
});

describe('QuotationDocument', () => {
  it('renders the header, title row, and generation date exactly as the reference PDFs do', () => {
    renderDocument([bride()], [makeSession()], new Date(2026, 7, 23));

    expect(screen.getByText('AARADHYA')).toBeInTheDocument();
    expect(screen.getByText('A COMPLETE DESTINATION')).toBeInTheDocument();
    expect(screen.getByText('GST No.: 27ABLFA0695F1ZC', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('+91 9423362122', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Event Quotation' })).toBeInTheDocument();
    // 23/08/2026 — FR-QUO-6: always the render-time date, DD/MM/YYYY.
    expect(screen.getByText('Quotation Date: 23/08/2026')).toBeInTheDocument();
  });

  it('renders exactly the rows in client_contacts[], in entry order, including a blank-Bride/Groom row (example_quatation_2.pdf)', () => {
    renderDocument(
      [
        { name: '', contactNumber: '', role: ClientContactRole.Bride },
        { name: '', contactNumber: '', role: ClientContactRole.Groom },
        { name: 'Mr. Saish Rege', contactNumber: '7875023468', role: ClientContactRole.POC },
      ],
      [],
    );

    const rows = screen.getAllByRole('row');
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
    renderDocument([{ name: '', contactNumber: '9998887777', role: ClientContactRole.POC }], []);

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2);
    expect(within(rows[1]!).getByText('Point of Contact')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('9998887777')).toBeInTheDocument();
  });

  it('renders one Event Details row per Session, formatted exactly like example_quatation_1.pdf', () => {
    renderDocument(
      [bride()],
      [
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
    );

    expect(screen.getByText('10/12/2026')).toBeInTheDocument();
    expect(screen.getByText('6pm to 10pm')).toBeInTheDocument();
    expect(screen.getByText('60,000/-')).toBeInTheDocument();
    expect(screen.getByText('11/12/2026')).toBeInTheDocument();
    expect(screen.getByText('9am to 3pm')).toBeInTheDocument();
    expect(screen.getByText('1,20,000/-')).toBeInTheDocument();
  });

  it('renders two Sessions on the same date as two separate rows, never merged (example_quatation_2.pdf: Halad+Engagement)', () => {
    renderDocument(
      [bride()],
      [
        makeSession({ id: 'halad', sessionType: 'Halad', venue: 'Half Banquet', startDate: '2027-02-26T00:00:00.000Z' }),
        makeSession({ id: 'engagement', sessionType: 'Engagement', venue: 'Poolside', startDate: '2027-02-26T00:00:00.000Z' }),
      ],
    );

    const eventDetailsTable = screen.getByRole('table', { name: 'Event Details' });
    const rows = within(eventDetailsTable).getAllByRole('row');
    // Header row + 2 data rows, not merged into one.
    expect(rows).toHaveLength(3);
    expect(within(rows[1]!).getByText('Halad')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Engagement')).toBeInTheDocument();
  });

  it('renders a single Session with full-width column headers, not a degenerate layout', () => {
    renderDocument([bride()], [makeSession()]);

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
    renderDocument([bride()], [makeSession({ sessionStatus: SessionStatus.Cancelled })]);

    expect(screen.getByText('No Sessions yet.')).toBeInTheDocument();
    expect(screen.queryByText('Engagement')).not.toBeInTheDocument();
  });
});
