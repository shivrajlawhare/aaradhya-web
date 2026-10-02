import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import { ToastProvider } from '../../src/components/ui/toast-provider';
import QuotationPreviewPage from '../../src/pages/quotation-preview/quotation-preview-page';
import { QUOTATION_PREVIEW_PATH_PATTERN, quotationPreviewPath } from '../../src/routes';
import { AuthProvider, SESSION_STORAGE_KEY } from '../../src/stores/auth-context';
import { theme } from '../../src/theme/theme';
import { mockMatchMedia } from '../support/match-media';

interface MockClientContact {
  name: string;
  contactNumber: string;
  role: string;
}

interface MockRoomLine {
  roomType: string;
  occupancy: number;
  tariff: number;
  noOfRooms: number;
  totalTaxable: number;
}

interface MockAccommodation {
  checkIn: string | null;
  checkOut: string | null;
  totalNights: number | null;
  roomLines: MockRoomLine[];
  totalOccupancy: number;
  totalCharges: number;
  discountPercent: number;
  discountAmount: number;
  finalAmount: number;
}

const makeAccommodation = (overrides: Partial<MockAccommodation> = {}): MockAccommodation => ({
  checkIn: null,
  checkOut: null,
  totalNights: null,
  roomLines: [],
  totalOccupancy: 0,
  totalCharges: 0,
  discountPercent: 0,
  discountAmount: 0,
  finalAmount: 0,
  ...overrides,
});

interface MockItem {
  type: string;
  totalCost: number | null;
  // STORY-071 — QuotationDocument resolves each Item's own menuItems id
  // array to display names; every real Item the API returns always has
  // this field (itemResultSchema's own `menuItems: z.array(z.string())`,
  // never `.optional()`), so these fixtures match that shape too rather
  // than the page defensively guarding against a state that can't happen.
  menuItems: string[];
}

interface MockSession {
  id: string;
  sessionType: string;
  venue: string;
  venueCost: number;
  startDate: string;
  endDate: string;
  pax: number;
  sessionStatus: string;
  items: MockItem[];
}

interface MockExtras {
  decoration: number;
  photographer: number;
  bhatji: number;
}

interface MockEvent {
  id: string;
  eventId: string;
  eventFamilyType: string;
  status: string;
  clientContacts: MockClientContact[];
  accommodation: MockAccommodation;
  sessions: MockSession[];
  extras: MockExtras;
}

// Mirrors src/pages/event-detail/format-amount.ts's own formatAmount — the
// screen displays grouped digits (en-IN); the "PDF" mock below deliberately
// does not, matching aaradhya-api's own quotation-pdf.ts, which interpolates
// the raw number with no formatting. The two are numerically identical, not
// textually identical, which is what this story's own AC actually means by
// "matches the PDF's numbers exactly."
const formatAmount = (amount: number): string => new Intl.NumberFormat('en-IN').format(amount);

const roundToCurrency = (amount: number) => Math.round(amount * 100) / 100;
const GST_RATE = 18;

// A plain-JS reimplementation of STORY-039's math, same reasoning
// event-detail-page.test.tsx's own computeQuotationSummary already uses —
// only Active sessions and Meal Items count (STORY-041's own Cancelled
// exclusion), reusing each item's already-mocked totalCost.
const computeQuotationSummary = (event: MockEvent) => {
  const activeSessions = event.sessions.filter((session) => session.sessionStatus === 'Active');
  const venueTotal = roundToCurrency(activeSessions.reduce((sum, session) => sum + session.venueCost, 0));
  const foodSubtotal = roundToCurrency(
    activeSessions.reduce(
      (sum, session) =>
        sum +
        session.items
          .filter((item) => item.type === 'Meal')
          .reduce((itemSum, item) => itemSum + (item.totalCost ?? 0), 0),
      0
    )
  );
  const foodTotalInclGst = roundToCurrency(foodSubtotal * (1 + GST_RATE / 100));
  // DEV-07: the Final Amount plus 5% GST.
  const accommodationTotal = roundToCurrency(event.accommodation.finalAmount * 1.05);
  const extrasTotal = roundToCurrency(event.extras.decoration + event.extras.photographer + event.extras.bhatji);
  return {
    venueTotal,
    foodSubtotal,
    foodTotalInclGst,
    accommodationTotal,
    extrasTotal,
    grandTotal: roundToCurrency(venueTotal + foodTotalInclGst + accommodationTotal + extrasTotal),
  };
};

const makeEvent = (overrides: Partial<MockEvent> = {}): MockEvent => ({
  id: 'event-1',
  eventId: 'ARD-EVT-2026-001',
  eventFamilyType: 'Wedding',
  status: 'Tentative',
  clientContacts: [{ name: 'Priya Nair', contactNumber: '9876543210', role: 'Bride' }],
  accommodation: makeAccommodation(),
  sessions: [],
  extras: { decoration: 0, photographer: 0, bhatji: 0 },
  ...overrides,
});

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

// The mocked PDF's own "content" is just plain text embedding the exact
// same grand total the mocked quotation-summary computes — proving the two
// endpoints stay consistent is the actual scope of a frontend test; real
// PDF byte generation/parsing is already covered by aaradhya-api's own
// STORY-043 test suite, and duplicating that tooling into this repo would
// verify nothing this story doesn't already own.
const pdfResponse = (event: MockEvent) =>
  Promise.resolve(
    new Response(`Grand Total: ${computeQuotationSummary(event).grandTotal}`, {
      status: 200,
      headers: { 'content-type': 'application/pdf' },
    })
  );

const seedSession = (role = 'EventManager') => {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ token: 'signed-jwt', user: { id: 'manager-1', name: 'Priya Nair', role } })
  );
};

const mockApi = ({ event, notFound = false }: { event?: MockEvent; notFound?: boolean }) => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (event && url.endsWith(`/events/${event.id}/quotation-summary`)) {
        return jsonResponse(200, computeQuotationSummary(event));
      }
      if (event && url.endsWith(`/events/${event.id}/quotation.pdf`)) {
        return pdfResponse(event);
      }
      // STORY-071 — QuotationDocument now resolves each Meal Item's raw
      // menuItems id array to display names via this list, fetched once by
      // quotation-preview-page.tsx itself; no mock Event in this file's own
      // fixtures attaches any menuItems id, so an empty list is enough.
      if (url.includes('/menu-items')) {
        return jsonResponse(200, []);
      }
      if (/\/events\/[^/]+$/.test(url)) {
        if (notFound || !event) {
          return jsonResponse(404, { error: { code: 'EVENT_NOT_FOUND', message: 'No Event with that id.' } });
        }
        return jsonResponse(200, event);
      }
      throw new Error(`Unhandled request: ${url}`);
    })
  );
};

const renderPage = (id = 'event-1', search = '') => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={[`${quotationPreviewPath(id)}${search}`]}>
                <Routes>
                  <Route path={QUOTATION_PREVIEW_PATH_PATTERN} element={<QuotationPreviewPage />} />
                </Routes>
              </MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('QuotationPreviewPage', () => {
  it('shows a 404 state for a nonexistent Event id', async () => {
    seedSession();
    mockApi({ notFound: true });
    renderPage('missing-event');

    expect(await screen.findByText('No Event with that id.')).toBeInTheDocument();
  });

  it('renders Client Details, per-Session details, Accommodation, and the Total Cost Summary', async () => {
    seedSession();
    mockApi({
      event: makeEvent({
        accommodation: makeAccommodation({
          checkIn: '2026-06-14T00:00:00.000Z',
          checkOut: '2026-06-16T00:00:00.000Z',
          totalNights: 2,
          roomLines: [{ roomType: 'Double', occupancy: 2, tariff: 5000, noOfRooms: 1, totalTaxable: 10000 }],
          totalCharges: 10000,
          finalAmount: 10000,
        }),
        sessions: [
          {
            id: 'session-1',
            sessionType: 'Wedding',
            venue: 'Lawn',
            venueCost: 5000,
            startDate: '2026-06-15T00:00:00.000Z',
            endDate: '2026-06-15T00:00:00.000Z',
            pax: 200,
            sessionStatus: 'Active',
            items: [{ type: 'Meal', totalCost: 2000, menuItems: [] }],
          },
        ],
      }),
    });
    renderPage();

    expect(await screen.findByText('Bride')).toBeInTheDocument();
    expect(screen.getByText('Priya Nair')).toBeInTheDocument();
    expect(screen.getByText('9876543210')).toBeInTheDocument();
    // STORY-072's own Total Cost Summary table also has a "Lawn" venue row
    // and a "5000" (bare, ungrouped) Total Cost with GST cell alongside the
    // Event Details summary table's own "Wedding"/"Lawn"/"5,000/-" —
    // scoped to that specific table so this test still pins down its own
    // section rather than asserting on an now-ambiguous bare text query.
    const eventDetailsTable = screen.getByRole('table', { name: 'Event Details' });
    expect(within(eventDetailsTable).getByText('Wedding')).toBeInTheDocument();
    expect(within(eventDetailsTable).getByText('Lawn')).toBeInTheDocument();
    expect(within(eventDetailsTable).getByText('5,000/-')).toBeInTheDocument();
    expect(screen.getByText('Double')).toBeInTheDocument();
    // Scoped to Accommodation Details: the line's taxable 10000 (2 nights,
    // no GST — DEV-07) and its Total Charges footer.
    const accommodationTable = screen.getByRole('table', { name: 'Accommodation Details' });
    expect(within(accommodationTable).getByText('10000')).toBeInTheDocument();
    expect(within(accommodationTable).getByText('₹ 10,000')).toBeInTheDocument();
    // The Total Cost Summary's Accommodation row adds 5% GST: 10500.
    const totalCostSummaryTable = screen.getByRole('table', { name: 'Total Cost Summary' });
    expect(within(totalCostSummaryTable).getByText('₹ 10,500')).toBeInTheDocument();
    // venueTotal 5000 + foodTotalInclGst (2000 × 1.18 = 2360) + accommodationTotal 10500 = 17860.
    expect(await screen.findByText('17,860')).toBeInTheDocument();
  });

  it('renders the "Event Quotation" title and the Aaradhya wordmark', async () => {
    seedSession();
    mockApi({ event: makeEvent() });
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Event Quotation' })).toBeInTheDocument();
    expect(screen.getByAltText('Aaradhya — A Complete Destination')).toBeInTheDocument();
  });

  it('still renders the Accommodation Details table (zero footer) for an Event with no Accommodation entered at all', async () => {
    seedSession();
    mockApi({ event: makeEvent() });
    renderPage();

    await screen.findByText('Client Details');
    expect(screen.getByText('Accommodation Details')).toBeInTheDocument();
    // A zero Total Charges footer (₹, example 3) and a zero Grand Total.
    const accommodationTable = screen.getByRole('table', { name: 'Accommodation Details' });
    expect(within(accommodationTable).getByText('₹ 0')).toBeInTheDocument();
    expect(screen.getAllByText('Rs. 0 /-')).toHaveLength(1);
  });

  it('excludes a Cancelled Session from the per-session list, matching the PDF', async () => {
    seedSession();
    mockApi({
      event: makeEvent({
        sessions: [
          {
            id: 'session-1',
            sessionType: 'Wedding',
            venue: 'Lawn',
            venueCost: 5000,
            startDate: '2026-06-15T00:00:00.000Z',
            endDate: '2026-06-15T00:00:00.000Z',
            pax: 200,
            sessionStatus: 'Cancelled',
            items: [],
          },
        ],
      }),
    });
    renderPage();

    await screen.findByText('Client Details');
    expect(screen.getByText('No Sessions yet.')).toBeInTheDocument();
    expect(screen.queryByText('Wedding')).not.toBeInTheDocument();
  });

  it("matches the PDF's grand total exactly for the same Event (cross-check against STORY-043)", async () => {
    seedSession();
    const event = makeEvent({
      accommodation: makeAccommodation({ totalCharges: 5900, finalAmount: 5900 }),
      sessions: [
        {
          id: 'session-1',
          sessionType: 'Wedding',
          venue: 'Lawn',
          venueCost: 5000,
          startDate: '2026-06-15T00:00:00.000Z',
          endDate: '2026-06-15T00:00:00.000Z',
          pax: 200,
          sessionStatus: 'Active',
          items: [{ type: 'Meal', totalCost: 2000, menuItems: [] }],
        },
      ],
      extras: { decoration: 1000, photographer: 0, bhatji: 0 },
    });
    mockApi({ event });
    let downloadedBlob: Blob | undefined;
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      downloadedBlob = blob as Blob;
      return 'blob:mock-url';
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderPage();

    const grandTotal = computeQuotationSummary(event).grandTotal;
    const screenGrandTotal = await screen.findByText(formatAmount(grandTotal));
    expect(screenGrandTotal).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: 'Share PDF' }));

    await waitFor(() => expect(downloadedBlob).toBeDefined());
    const pdfText = await downloadedBlob!.text();
    // Numerically identical to what's on screen, not textually identical —
    // the screen groups digits (en-IN), the real PDF renderer doesn't.
    expect(pdfText).toBe(`Grand Total: ${grandTotal}`);
    expect(Number(pdfText.replace('Grand Total: ', ''))).toBe(grandTotal);

    vi.restoreAllMocks();
  });
});

describe('QuotationPreviewPage — toolbar and canvas (DEV-09, D9/D10)', () => {
  it('shows "Back to event", the title, event ID, status chip and Share PDF on desktop', async () => {
    mockMatchMedia(true);
    seedSession();
    mockApi({ event: makeEvent() });
    renderPage();

    const backLink = await screen.findByRole('link', { name: 'Back to event' });
    expect(backLink).toHaveAttribute('href', '/events/event-1');
    expect(screen.getByText('ARD-EVT-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Tentative')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share PDF' })).toBeInTheDocument();
    // One page heading: the document's own "Event Quotation".
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.queryByText('Pinch to zoom')).not.toBeInTheDocument();
  });

  it('uses icon buttons and a "Pinch to zoom" hint over the scaled paper on mobile', async () => {
    mockMatchMedia(false);
    seedSession();
    mockApi({ event: makeEvent() });
    renderPage();

    expect(await screen.findByText('Pinch to zoom')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to event' })).toHaveAttribute('href', '/events/event-1');
    expect(screen.getByText('Quotation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share PDF' })).toBeInTheDocument();
  });

  it('renders only the document in ?print=1 — no toolbar, hint or cost panel (the server-side PDF view)', async () => {
    mockMatchMedia(true);
    seedSession();
    mockApi({ event: makeEvent() });
    renderPage('event-1', '?print=1');

    expect(await screen.findByRole('heading', { name: 'Event Quotation' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Back to event' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Share PDF' })).not.toBeInTheDocument();
    expect(screen.queryByText('Pinch to zoom')).not.toBeInTheDocument();
    expect(screen.queryByText('Grand Total', { selector: 'p' })).not.toBeInTheDocument();
  });

  it('shows only the mark in the toolbar while the Event is loading', () => {
    mockMatchMedia(true);
    seedSession();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    );
    renderPage();

    expect(screen.getByText('Loading event')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Back to event' })).not.toBeInTheDocument();
  });
});
