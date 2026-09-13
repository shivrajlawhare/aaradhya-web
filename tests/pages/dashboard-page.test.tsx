import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import DashboardPage from '../../src/pages/dashboard/dashboard-page';
import { DASHBOARD_PATH, EVENT_DETAIL_PATH_PATTERN } from '../../src/routes';
import { AuthProvider, SESSION_STORAGE_KEY } from '../../src/stores/auth-context';
import { theme } from '../../src/theme/theme';

interface MockDashboardCounts {
  todaysEvents: number;
  upcoming: number;
  tentative: number;
  confirmed: number;
}

interface MockUpcomingEvent {
  id: string;
  eventId: string;
  eventFamilyType: string;
  status: string;
  date: string;
  venue: string;
  pax: number;
  clientContacts?: { name: string; contactNumber: string; role: string }[];
}

const makeCounts = (overrides: Partial<MockDashboardCounts> = {}): MockDashboardCounts => ({
  todaysEvents: 0,
  upcoming: 0,
  tentative: 0,
  confirmed: 0,
  ...overrides,
});

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

const mockDashboardApi = (counts: MockDashboardCounts, upcomingEvents: MockUpcomingEvent[]) => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/dashboard')) {
        return jsonResponse(200, { counts, upcomingEvents });
      }
      throw new Error(`Unhandled request: ${url}`);
    }),
  );
};

const seedSession = (role = 'EventManager') => {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ token: 'signed-jwt', user: { id: 'manager-1', name: 'Priya Nair', role } }),
  );
};

const renderPage = () => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <MemoryRouter initialEntries={[DASHBOARD_PATH]}>
              <Routes>
                <Route path={DASHBOARD_PATH} element={<DashboardPage />} />
                <Route path={EVENT_DETAIL_PATH_PATTERN} element={<div>event detail placeholder</div>} />
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>,
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('DashboardPage', () => {
  it('renders the four count tiles with real numbers, including zero states', async () => {
    seedSession();
    mockDashboardApi(makeCounts({ todaysEvents: 2, upcoming: 5, tentative: 3, confirmed: 0 }), []);
    renderPage();

    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    // Confirmed is 0 — still renders a real tile, not blank.
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText("Today's Events")).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('Tentative')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('renders an empty state for the upcoming-events table when there are none, tiles still showing 0', async () => {
    seedSession();
    mockDashboardApi(makeCounts(), []);
    renderPage();

    expect(await screen.findByText('No upcoming Events')).toBeInTheDocument();
    // All four tiles show a real "0", not blank.
    expect(screen.getAllByText('0')).toHaveLength(4);
  });

  it('renders the upcoming-events table with date, event, client, venue, pax, and status', async () => {
    seedSession();
    mockDashboardApi(makeCounts({ upcoming: 1 }), [
      {
        id: 'event-1',
        eventId: 'ARD-EVT-2026-001',
        eventFamilyType: 'Wedding',
        status: 'Tentative',
        date: '2026-06-15T00:00:00.000Z',
        venue: 'Lawn',
        pax: 200,
        clientContacts: [{ name: 'Priya Nair', contactNumber: '9876543210', role: 'Bride' }],
      },
    ]);
    renderPage();

    expect(await screen.findByText('2026-06-15')).toBeInTheDocument();
    expect(screen.getByText('Wedding')).toBeInTheDocument();
    expect(screen.getByText('ARD-EVT-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Priya Nair')).toBeInTheDocument();
    expect(screen.getByText('Lawn')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('Tentative', { selector: '.MuiChip-label' })).toBeInTheDocument();
  });

  it('shows "—" for the client column when clientContacts is genuinely absent (e.g. Housekeeping)', async () => {
    seedSession('Housekeeping');
    mockDashboardApi(makeCounts({ upcoming: 1 }), [
      {
        id: 'event-1',
        eventId: 'ARD-EVT-2026-001',
        eventFamilyType: 'Wedding',
        status: 'Tentative',
        date: '2026-06-15T00:00:00.000Z',
        venue: 'Lawn',
        pax: 200,
      },
    ]);
    renderPage();

    expect(await screen.findByText('Lawn')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('navigates to the Event detail screen when a row is activated', async () => {
    seedSession();
    mockDashboardApi(makeCounts({ upcoming: 1 }), [
      {
        id: 'event-1',
        eventId: 'ARD-EVT-2026-001',
        eventFamilyType: 'Wedding',
        status: 'Tentative',
        date: '2026-06-15T00:00:00.000Z',
        venue: 'Lawn',
        pax: 200,
        clientContacts: [{ name: 'Priya Nair', contactNumber: '9876543210', role: 'Bride' }],
      },
    ]);
    renderPage();

    fireEvent.click(await screen.findByRole('link', { name: 'Open Event ARD-EVT-2026-001' }));

    expect(await screen.findByText('event detail placeholder')).toBeInTheDocument();
  });
});
