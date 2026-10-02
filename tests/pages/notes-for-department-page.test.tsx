import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import App from '../../src/app';
import { ToastProvider } from '../../src/components/ui/toast-provider';
import { notesForDepartmentPath } from '../../src/routes';
import { AuthProvider, SESSION_STORAGE_KEY } from '../../src/stores/auth-context';
import { theme } from '../../src/theme/theme';
import { mockMatchMedia } from '../support/match-media';
import { DINNER_MENU, HALDI_BEO_SESSION, SAMPLE_BEO, SAMPLE_BEO_SESSION } from '../support/notes-for-department-sample';

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

// Any rupee sign, "Rs.", a "/-" amount or an Indian-grouped number.
const MONEY_PATTERN = /₹|Rs\.|\d\/-|\d{1,3},\d{2,3}/;

let pdfRequests = 0;

const mockApi = ({
  order = SAMPLE_BEO,
  orderStatus = 200,
  pdfStatus = 200,
}: { order?: unknown; orderStatus?: number; pdfStatus?: number } = {}) => {
  pdfRequests = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/banquet-event-order.pdf')) {
        pdfRequests += 1;
        if (pdfStatus !== 200) {
          return jsonResponse(pdfStatus, { error: { code: 'SERVER_ERROR', message: 'boom' } });
        }
        return Promise.resolve(
          new Response('%PDF beo', { status: 200, headers: { 'content-type': 'application/pdf' } })
        );
      }
      if (url.includes('/banquet-event-order')) {
        if (orderStatus !== 200) {
          return jsonResponse(orderStatus, { error: { code: 'EVENT_NOT_FOUND', message: 'No Event with that id.' } });
        }
        return jsonResponse(200, order);
      }
      throw new Error(`Unhandled request: ${url}`);
    })
  );
};

const seedSession = (role = 'EventManager') =>
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ token: 'signed-jwt', user: { id: 'user-1', name: 'Priya Nair', role } })
  );

// Through the real App routes, so the role guard is exercised too.
const renderPage = (search = '') =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={[`${notesForDepartmentPath(SAMPLE_BEO.id)}${search}`]}>
                <App />
              </MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>
  );

beforeEach(() => {
  mockMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
  mockMatchMedia(false);
});

describe('Notes for Department page (DEV-12)', () => {
  it.each(['EventManager', 'FnBHead', 'Housekeeping', 'Reception'])('opens for role %s', async (role) => {
    seedSession(role);
    mockApi();
    renderPage();

    expect(await screen.findByRole('article', { name: /Banquet Event Order/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
  });

  it('sends a signed-out visitor to login', async () => {
    mockApi();
    renderPage();

    expect(await screen.findByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('renders the notes_for_department.pdf sample page', async () => {
    seedSession('Housekeeping');
    mockApi();
    renderPage();

    const page = await screen.findByRole('article', { name: 'Banquet Event Order — Birthday Party/ Cocktail party' });
    expect(within(page).getByRole('heading', { name: 'Banquet Event Order' })).toBeInTheDocument();
    const details = [
      { label: 'Client name', value: 'Dr. Chubhe' },
      { label: 'Date', value: '26 Aug 2026' },
      { label: 'Time', value: '8pm to 11pm' },
      { label: 'Number of Pax', value: '20' },
      { label: 'Venue', value: 'Mini Party Hall' },
      { label: 'Function Type', value: 'Birthday Party/ Cocktail party' },
    ];
    for (const { label, value } of details) {
      expect(within(page).getByText(label, { selector: 'dt' }).nextElementSibling).toHaveTextContent(value);
    }
    const kitchen = within(page).getByRole('region', { name: 'Kitchen/Menu' });
    expect(within(kitchen).getByText('Veg – 4 pax')).toBeInTheDocument();
    expect(within(kitchen).getByText('Non-Veg – 16 pax')).toBeInTheDocument();
    expect(within(kitchen).getByText('Dinner (8pm to 11pm)')).toBeInTheDocument();
    expect(
      within(kitchen)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual(DINNER_MENU);
    const housekeeping = within(page).getByRole('region', { name: 'House Keeping' });
    expect(
      within(housekeeping)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual(['Square Table Setup', 'Cake cutting Setup']);
    expect(within(page).getByRole('region', { name: 'Maintainance' })).toHaveTextContent('Sound System');
    expect(within(page).getByRole('region', { name: 'Restaurant' })).toHaveTextContent(
      'Billing will be as per a la carte.'
    );
  });

  it('prints one page per session and omits an empty department box', async () => {
    seedSession();
    mockApi({ order: { ...SAMPLE_BEO, sessions: [SAMPLE_BEO_SESSION, HALDI_BEO_SESSION] } });
    renderPage();

    const pages = await screen.findAllByRole('article', { name: /Banquet Event Order/ });
    expect(pages).toHaveLength(2);
    expect(within(pages[1]!).queryByRole('region', { name: 'Restaurant' })).not.toBeInTheDocument();
    expect(within(pages[1]!).getByText('12 Tables / 120 Chairs')).toBeInTheDocument();
  });

  it('shows no currency or amount anywhere on the page', async () => {
    seedSession();
    mockApi({ order: { ...SAMPLE_BEO, sessions: [SAMPLE_BEO_SESSION, HALDI_BEO_SESSION] } });
    renderPage();

    await screen.findAllByRole('article', { name: /Banquet Event Order/ });
    expect(document.body.textContent).not.toMatch(MONEY_PATTERN);
  });

  it('downloads <eventId>-notes-for-department.pdf', async () => {
    seedSession('Reception');
    mockApi();
    let downloaded: Blob | undefined;
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      downloaded = blob as Blob;
      return 'blob:beo';
    });
    let fileName = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      fileName = this.download;
    });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Download PDF' }));

    await waitFor(() => expect(downloaded).toBeDefined());
    expect(await downloaded!.text()).toBe('%PDF beo');
    expect(fileName).toBe('ARD-EVT-2026-031-notes-for-department.pdf');
    expect(pdfRequests).toBe(1);
  });

  it('shows the PDF error and keeps the pages when the download fails', async () => {
    seedSession();
    mockApi({ pdfStatus: 500 });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Download PDF' }));

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: /Banquet Event Order/ })).toBeInTheDocument();
  });

  it('has "Back to event" and the title with the event ID in the toolbar', async () => {
    seedSession();
    mockApi();
    renderPage();

    const back = await screen.findByRole('link', { name: 'Back to event' });
    expect(back).toHaveAttribute('href', `/events/${SAMPLE_BEO.id}`);
    expect(screen.getAllByText('Banquet Event Order').length).toBeGreaterThan(0);
    expect(screen.getByText('ARD-EVT-2026-031')).toBeInTheDocument();
  });

  it('renders only the pages in print mode', async () => {
    seedSession();
    mockApi();
    renderPage('?print=1');

    expect(await screen.findByRole('article', { name: /Banquet Event Order/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download PDF' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Back to event' })).not.toBeInTheDocument();
  });

  it('shows the not-found state for an unknown event', async () => {
    seedSession();
    mockApi({ orderStatus: 404 });
    renderPage();

    expect(await screen.findByText('No Event with that id.')).toBeInTheDocument();
  });

  it('uses the download icon button and the pinch hint on mobile', async () => {
    mockMatchMedia(false);
    seedSession();
    mockApi();
    renderPage();

    expect(await screen.findByText('Pinch to zoom')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
  });
});
