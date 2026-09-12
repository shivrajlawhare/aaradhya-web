import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import CalendarPage from '../../src/pages/calendar/calendar-page';
import { CALENDAR_PATH, EVENT_DETAIL_PATH_PATTERN } from '../../src/routes';
import { colorTokens } from '../../src/theme/tokens';
import { theme } from '../../src/theme/theme';

interface MockCalendarSession {
  id: string;
  sessionType: string;
  venue: string;
  venueCost: number;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  pax: number;
  sessionStatus: string;
  durationDays: number;
  isMultiDay: boolean;
  setup: {
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
  items: unknown[];
  event: { id: string; eventFamilyType: string; status: string };
}

const makeSession = (overrides: Partial<MockCalendarSession> = {}): MockCalendarSession => ({
  id: 'session-1',
  sessionType: 'Wedding',
  venue: 'Lawn',
  venueCost: 50000,
  startDate: '2026-09-12T00:00:00.000Z',
  endDate: '2026-09-14T00:00:00.000Z',
  startTime: null,
  endTime: null,
  pax: 200,
  sessionStatus: 'Active',
  durationDays: 3,
  isMultiDay: true,
  setup: {
    seating: null,
    tableCount: 0,
    chairCount: 0,
    stage: false,
    buffet: false,
    registrationDesk: false,
    vipSeating: false,
    brideGroomSeating: false,
    notes: null,
  },
  items: [],
  event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative' },
  ...overrides,
});

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

const mockCalendarApi = (sessions: MockCalendarSession[]) => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/calendar')) {
        return jsonResponse(200, sessions);
      }
      throw new Error(`Unhandled request: ${url}`);
    }),
  );
};

const renderPage = () => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[CALENDAR_PATH]}>
            <Routes>
              <Route path={CALENDAR_PATH} element={<CalendarPage />} />
              <Route path={EVENT_DETAIL_PATH_PATTERN} element={<div>event detail placeholder</div>} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>,
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

// Every fixture session in this file lands in September 2026 — clicks
// "Next month" however many times that takes from whichever month the
// suite actually starts on ("today"), so the tests stay correct regardless
// of when they run.
const navigateToSeptember2026 = async () => {
  const nextButton = await screen.findByRole('button', { name: 'Next month' });
  const now = new Date();
  let monthsToAdvance = (2026 - now.getFullYear()) * 12 + (9 - 1 - now.getMonth());
  while (monthsToAdvance > 0) {
    fireEvent.click(nextButton);
    monthsToAdvance -= 1;
  }
  await screen.findByText('September 2026');
};

describe('CalendarPage', () => {
  it('shows the current month by default', async () => {
    mockCalendarApi([]);
    renderPage();

    const now = new Date();
    const label = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it("shows a fixture 3-day session's chip on all three of its dates, across a week-row break", async () => {
    // Sept 12-14 2026: the 12th/13th fall in the grid's second row, the
    // 14th in the third — the same week-row-break case this story's own
    // AC names explicitly.
    mockCalendarApi([
      makeSession({ startDate: '2026-09-12T00:00:00.000Z', endDate: '2026-09-14T00:00:00.000Z' }),
    ]);
    renderPage();

    await navigateToSeptember2026();
    const chips = await screen.findAllByText('Wedding');
    expect(chips).toHaveLength(3);
  });

  it('renders two Sessions of the same Event active on the same day as one chip, not two', async () => {
    mockCalendarApi([
      makeSession({
        id: 'session-1',
        sessionType: 'Haldi',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative' },
      }),
      makeSession({
        id: 'session-2',
        sessionType: 'Vendor Setup',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative' },
      }),
    ]);
    renderPage();

    await navigateToSeptember2026();

    expect(await screen.findAllByText('Wedding')).toHaveLength(1);
  });

  it('renders two different Events active on the same day as two separate chips', async () => {
    mockCalendarApi([
      makeSession({
        id: 'session-1',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative' },
      }),
      makeSession({
        id: 'session-2',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-2', eventFamilyType: 'Corporate Offsite', status: 'Confirmed' },
      }),
    ]);
    renderPage();

    await navigateToSeptember2026();

    expect(await screen.findByText('Wedding')).toBeInTheDocument();
    expect(await screen.findByText('Corporate Offsite')).toBeInTheDocument();
  });

  it.each([
    ['Tentative', colorTokens.statusTentativeTint],
    ['Confirmed', colorTokens.statusConfirmedTint],
    ['Completed', colorTokens.statusCompletedTint],
    ['Cancelled', colorTokens.statusCancelledTint],
  ])("renders a chip in the parent Event's %s status color", async (status, tint) => {
    mockCalendarApi([
      makeSession({
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status },
      }),
    ]);
    renderPage();

    await navigateToSeptember2026();

    const chipLabel = await screen.findByText('Wedding');
    const chip = chipLabel.closest('.MuiChip-root');
    if (!chip) {
      throw new Error('expected a MuiChip-root ancestor');
    }
    await waitFor(() => expect(chip).toHaveStyle({ backgroundColor: tint }));
  });

  it("navigates to the Event's detail screen when its chip is tapped", async () => {
    mockCalendarApi([
      makeSession({
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-42', eventFamilyType: 'Wedding', status: 'Tentative' },
      }),
    ]);
    renderPage();

    await navigateToSeptember2026();

    const chip = await screen.findByText('Wedding');
    fireEvent.click(chip);

    await screen.findByText('event detail placeholder');
  });

  it('moves back a month with Previous month', async () => {
    mockCalendarApi([]);
    renderPage();

    const now = new Date();
    const previousMonthDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
    const previousLabel = previousMonthDate.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Previous month' }));

    expect(await screen.findByText(previousLabel)).toBeInTheDocument();
  });

  it('renders the day-of-week header row', async () => {
    mockCalendarApi([]);
    renderPage();

    for (const label of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
      expect(await screen.findByText(label)).toBeInTheDocument();
    }
  });
});
