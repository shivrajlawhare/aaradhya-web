import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import DashboardPage from '../../src/pages/dashboard/dashboard-page';
import {
  CALENDAR_PATH,
  DASHBOARD_PATH,
  EVENT_CREATE_PATH,
  EVENT_DETAIL_PATH_PATTERN,
  EVENT_LIST_PATH,
  LOGIN_PATH,
  USER_MANAGEMENT_PATH,
} from '../../src/routes';
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
  meals?: { mealName: string | null; startTime: string | null; endTime: string | null }[];
  setup?: {
    seating: string | null;
    tableCount: number;
    chairCount: number;
    stage: boolean;
    buffet: boolean;
    registrationDesk: boolean;
    vipSeating: boolean;
    brideGroomSeating: boolean;
    notes: string | null;
  };
  accommodation?: {
    checkIn: string | null;
    checkOut: string | null;
    totalDays: number | null;
    roomLines: { roomType: string; occupancy: number; noOfRooms: number }[];
    totalOccupancy: number;
    totalCharges?: number;
  };
}

const makeSetup = (overrides: Partial<NonNullable<MockUpcomingEvent['setup']>> = {}): NonNullable<
  MockUpcomingEvent['setup']
> => ({
  seating: null,
  tableCount: 0,
  chairCount: 0,
  stage: false,
  buffet: false,
  registrationDesk: false,
  vipSeating: false,
  brideGroomSeating: false,
  notes: null,
  ...overrides,
});

const makeAccommodation = (
  overrides: Partial<NonNullable<MockUpcomingEvent['accommodation']>> = {},
): NonNullable<MockUpcomingEvent['accommodation']> => ({
  checkIn: null,
  checkOut: null,
  totalDays: null,
  roomLines: [],
  totalOccupancy: 0,
  ...overrides,
});

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
                <Route path={EVENT_LIST_PATH} element={<div>event list placeholder</div>} />
                <Route path={CALENDAR_PATH} element={<div>calendar placeholder</div>} />
                <Route path={EVENT_CREATE_PATH} element={<div>event creation placeholder</div>} />
                <Route path={USER_MANAGEMENT_PATH} element={<div>user management placeholder</div>} />
                <Route path={LOGIN_PATH} element={<div>login placeholder</div>} />
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

  describe('F&B Head dashboard (STORY-049)', () => {
    it('renders a Meal / Timing column with mealName and start-end time for F&B Head', async () => {
      seedSession('FnBHead');
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
          meals: [{ mealName: 'Lunch', startTime: '12:00', endTime: '14:00' }],
        },
      ]);
      renderPage();

      expect(await screen.findByText('Meal / Timing')).toBeInTheDocument();
      expect(screen.getByText('Lunch (12:00-14:00)')).toBeInTheDocument();
    });

    it('shows "—" in the Meal / Timing column when the soonest session has no Meal Items yet', async () => {
      seedSession('FnBHead');
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
          meals: [],
        },
      ]);
      renderPage();

      expect(await screen.findByText('Meal / Timing')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('does not render a Meal / Timing column for the Event Manager view (no `meals` key on the response)', async () => {
      seedSession('EventManager');
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

      expect(await screen.findByText('Lawn')).toBeInTheDocument();
      expect(screen.queryByText('Meal / Timing')).not.toBeInTheDocument();
    });

    // DOM inspection, not just "the design doesn't show it" (this story's
    // own AC wording) — asserts directly against rendered column headers
    // and cell text, for an F&B-Head-fed dashboard specifically.
    it('has no payment column and no non-food setup column, verified by DOM inspection', async () => {
      seedSession('FnBHead');
      mockDashboardApi(makeCounts({ upcoming: 1 }), [
        {
          id: 'event-1',
          eventId: 'ARD-EVT-2026-001',
          eventFamilyType: 'Wedding',
          status: 'Tentative',
          date: '2026-06-15T00:00:00.000Z',
          venue: 'Lawn',
          pax: 200,
          meals: [{ mealName: 'Lunch', startTime: '12:00', endTime: '14:00' }],
        },
      ]);
      const { container } = renderPage();

      expect(await screen.findByText('Lawn')).toBeInTheDocument();
      const headerCells = Array.from(container.querySelectorAll('th')).map((cell) => cell.textContent);
      expect(headerCells).toEqual(['Date', 'Event', 'Client', 'Venue', 'Pax', 'Status', 'Meal / Timing']);
      expect(screen.queryByText(/payment/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/setup/i)).not.toBeInTheDocument();
    });
  });

  describe('Housekeeping dashboard (STORY-050)', () => {
    it('renders Setup and Rooms columns with the row\'s setup/accommodation detail for Housekeeping', async () => {
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
          setup: makeSetup({ seating: 'Theatre', tableCount: 10, chairCount: 100, stage: true }),
          accommodation: makeAccommodation({
            roomLines: [{ roomType: 'Double', occupancy: 2, noOfRooms: 3 }],
            totalOccupancy: 6,
          }),
        },
      ]);
      renderPage();

      expect(await screen.findByText('Setup')).toBeInTheDocument();
      expect(screen.getByText('Rooms')).toBeInTheDocument();
      expect(screen.getByText('Theatre, 10T/100C, Stage')).toBeInTheDocument();
      expect(screen.getByText('Double x3')).toBeInTheDocument();
    });

    it('shows "—" for Setup/Rooms when Housekeeping can see the columns but this row has none entered yet', async () => {
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
          setup: makeSetup(),
          accommodation: makeAccommodation(),
        },
      ]);
      renderPage();

      expect(await screen.findByText('Setup')).toBeInTheDocument();
      // Client (absent for Housekeeping), Setup, Rooms — three "—" cells.
      expect(screen.getAllByText('—')).toHaveLength(3);
    });

    it('does not render Setup/Rooms columns for the Event Manager view (no `setup`/`accommodation` keys on the response)', async () => {
      seedSession('EventManager');
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

      expect(await screen.findByText('Lawn')).toBeInTheDocument();
      expect(screen.queryByText('Setup')).not.toBeInTheDocument();
      expect(screen.queryByText('Rooms')).not.toBeInTheDocument();
    });

    // DOM inspection, not just "the design doesn't show it" (same AC
    // wording as STORY-049's) — a Housekeeping-fed dashboard has no payment
    // or menu column, and does get its own setup/rooms columns.
    it('has no payment column and no menu column, verified by DOM inspection', async () => {
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
          setup: makeSetup({ seating: 'Theatre' }),
          accommodation: makeAccommodation({ roomLines: [{ roomType: 'Double', occupancy: 2, noOfRooms: 1 }] }),
        },
      ]);
      const { container } = renderPage();

      expect(await screen.findByText('Lawn')).toBeInTheDocument();
      const headerCells = Array.from(container.querySelectorAll('th')).map((cell) => cell.textContent);
      expect(headerCells).toEqual(['Date', 'Event', 'Client', 'Venue', 'Pax', 'Status', 'Setup', 'Rooms']);
      expect(screen.queryByText(/payment/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Meal / Timing')).not.toBeInTheDocument();
    });
  });

  describe('Reception dashboard (STORY-051)', () => {
    it('shows Bride/Groom names in the Client column, and rooms + check-in/out in the Rooms column', async () => {
      seedSession('Reception');
      mockDashboardApi(makeCounts({ upcoming: 1 }), [
        {
          id: 'event-1',
          eventId: 'ARD-EVT-2026-001',
          eventFamilyType: 'Wedding',
          status: 'Tentative',
          date: '2026-06-15T00:00:00.000Z',
          venue: 'Lawn',
          pax: 200,
          clientContacts: [
            { name: 'Priya Nair', contactNumber: '9876543210', role: 'Bride' },
            { name: 'Rohan Shah', contactNumber: '9876500000', role: 'Groom' },
          ],
          accommodation: makeAccommodation({
            checkIn: '2026-06-14T00:00:00.000Z',
            checkOut: '2026-06-16T00:00:00.000Z',
            roomLines: [{ roomType: 'Double', occupancy: 2, noOfRooms: 1 }],
          }),
        },
      ]);
      renderPage();

      expect(await screen.findByText('Priya Nair, Rohan Shah')).toBeInTheDocument();
      expect(screen.getByText('Rooms')).toBeInTheDocument();
      expect(screen.getByText('Double x1 | Check-in 2026-06-14 - Check-out 2026-06-16')).toBeInTheDocument();
    });

    it('shows "—" in the Rooms column when Reception can see it but no rooms or dates are entered yet', async () => {
      seedSession('Reception');
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
          accommodation: makeAccommodation(),
        },
      ]);
      renderPage();

      expect(await screen.findByText('Rooms')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    // DOM inspection, not just "the design doesn't show it" — same AC
    // wording as STORY-049/050's own edge cases: no payment column, no menu
    // column, and no Setup column (that one's Housekeeping-only).
    it('has no payment column, no menu column, and no Setup column, verified by DOM inspection', async () => {
      seedSession('Reception');
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
          accommodation: makeAccommodation({ roomLines: [{ roomType: 'Double', occupancy: 2, noOfRooms: 1 }] }),
        },
      ]);
      const { container } = renderPage();

      expect(await screen.findByText('Lawn')).toBeInTheDocument();
      const headerCells = Array.from(container.querySelectorAll('th')).map((cell) => cell.textContent);
      expect(headerCells).toEqual(['Date', 'Event', 'Client', 'Venue', 'Pax', 'Status', 'Rooms']);
      expect(screen.queryByText(/payment/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Meal / Timing')).not.toBeInTheDocument();
      expect(screen.queryByText('Setup')).not.toBeInTheDocument();
    });
  });

  // Navigation (Events/Calendar/New Event/User Management/Logout) moved out
  // of DashboardPage and into AppShell (STORY-053) — DashboardPage no
  // longer renders any of it itself. See tests/components/app-shell.test.tsx.
});
