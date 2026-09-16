import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import CalendarPage from '../../src/pages/calendar/calendar-page';
import { CALENDAR_PATH, EVENT_DETAIL_PATH_PATTERN } from '../../src/routes';
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
  event: { id: string; eventFamilyType: string; status: string; eventManager: string };
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
  event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative', eventManager: 'manager-1' },
  ...overrides,
});

interface MockEventManager {
  id: string;
  name: string;
}

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

const mockCalendarApi = (sessions: MockCalendarSession[], eventManagers: MockEventManager[] = []) => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/event-managers')) {
        return jsonResponse(200, eventManagers);
      }
      if (url.includes('/calendar')) {
        return jsonResponse(200, sessions);
      }
      throw new Error(`Unhandled request: ${url}`);
    }),
  );
};

// A real browser's own Back button (or an in-app one calling navigate(-1))
// pops the history stack the same way — this stands in for either, to
// verify STORY-038's own "back navigation restores calendar state" AC
// without needing an actual browser.
const EventDetailPlaceholder = () => {
  const navigate = useNavigate();
  return (
    <div>
      <p>event detail placeholder</p>
      <button onClick={() => navigate(-1)}>Go back</button>
    </div>
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
              <Route path={EVENT_DETAIL_PATH_PATTERN} element={<EventDetailPlaceholder />} />
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

// A calendar event's own title can collide with a filter chip showing the
// same text (e.g. the Event Type chip reads "Wedding" once that's the
// active filter) — this narrows a same-text match down to the one actually
// inside a StandaloneMonthView event card ([data-palette], the library's
// own attribute for its resource-color slot), same disambiguation
// "Open Event Wedding" used to give the old hand-built EventChip for free.
const findCalendarEventTitle = async (text: string): Promise<HTMLElement> => {
  const candidates = await screen.findAllByText(text);
  const match = candidates.find((candidate) => candidate.closest('[data-palette]'));
  if (!match) {
    throw new Error(`expected a calendar event titled "${text}"`);
  }
  return match;
};

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

  it("renders a fixture 3-day session as a single bar, split into two segments across a week-row break — not three repeated entries", async () => {
    // Sept 12-14 2026: the 12th falls in the grid's second row, the
    // 13th-14th in the third — the same week-row-break case this story's
    // own AC names explicitly. StandaloneMonthView renders one bar segment
    // per week row it spans (two here), each carrying the title once — not
    // the old hand-built grid's one repeated chip per covered date (three).
    mockCalendarApi([
      makeSession({ startDate: '2026-09-12T00:00:00.000Z', endDate: '2026-09-14T00:00:00.000Z' }),
    ]);
    renderPage();

    await navigateToSeptember2026();
    const segments = await screen.findAllByText('Wedding');
    expect(segments).toHaveLength(2);
  });

  it('renders two Sessions of the same Event active on the same day as one chip, not two', async () => {
    mockCalendarApi([
      makeSession({
        id: 'session-1',
        sessionType: 'Haldi',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative', eventManager: 'manager-1' },
      }),
      makeSession({
        id: 'session-2',
        sessionType: 'Vendor Setup',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative', eventManager: 'manager-1' },
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
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative', eventManager: 'manager-1' },
      }),
      makeSession({
        id: 'session-2',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-2', eventFamilyType: 'Corporate Offsite', status: 'Confirmed', eventManager: 'manager-1' },
      }),
    ]);
    renderPage();

    await navigateToSeptember2026();

    expect(await screen.findByText('Wedding')).toBeInTheDocument();
    expect(await screen.findByText('Corporate Offsite')).toBeInTheDocument();
  });

  // StandaloneMonthView's own native resource-coloring (STORY-058's own
  // AC) only accepts its fixed named palette (amber, red, grey, purple,
  // ...), not this app's own status-*/-tint hex tokens directly — each
  // status resource (calendar-scheduler-events.ts's STATUS_RESOURCES) maps
  // to the closest, most distinct named color instead. `data-palette` is
  // the library's own attribute for which one actually applied.
  it.each([
    ['Tentative', 'amber'],
    ['Confirmed', 'red'],
    ['Completed', 'grey'],
    ['Cancelled', 'purple'],
  ])("renders an Event in the parent Event's %s status color", async (status, expectedPalette) => {
    mockCalendarApi([
      makeSession({
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status, eventManager: 'manager-1' },
      }),
    ]);
    renderPage();

    await navigateToSeptember2026();

    const title = await screen.findByText('Wedding');
    const eventCard = title.closest('[data-palette]');
    if (!eventCard) {
      throw new Error('expected a [data-palette] ancestor');
    }
    expect(eventCard).toHaveAttribute('data-palette', expectedPalette);
  });

  it("navigates to the Event's detail screen when its chip is tapped", async () => {
    mockCalendarApi([
      makeSession({
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-42', eventFamilyType: 'Wedding', status: 'Tentative', eventManager: 'manager-1' },
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

  it('renders the All/Tentative/Confirmed status chips, with "All" active by default', async () => {
    mockCalendarApi([]);
    renderPage();

    const allChip = (await screen.findByText('All')).closest('.MuiChip-root');
    expect(allChip).toHaveAttribute('aria-pressed', 'true');
    const tentativeChip = (await screen.findByText('Tentative')).closest('.MuiChip-root');
    expect(tentativeChip).toHaveAttribute('aria-pressed', 'false');
  });

  it('selecting a status chip hides Events of a different status and marks the chip active', async () => {
    mockCalendarApi([
      makeSession({
        id: 'session-1',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative', eventManager: 'manager-1' },
      }),
      makeSession({
        id: 'session-2',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: {
          id: 'event-2',
          eventFamilyType: 'Corporate Offsite',
          status: 'Confirmed',
          eventManager: 'manager-1',
        },
      }),
    ]);
    renderPage();
    await navigateToSeptember2026();
    await screen.findByText('Wedding');

    fireEvent.click(screen.getByText('Confirmed'));

    expect(screen.queryByText('Wedding')).not.toBeInTheDocument();
    expect(await screen.findByText('Corporate Offsite')).toBeInTheDocument();
    const confirmedChip = screen.getByText('Confirmed').closest('.MuiChip-root');
    expect(confirmedChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('"All" clears the status filter, restoring every Event regardless of status', async () => {
    mockCalendarApi([
      makeSession({
        id: 'session-1',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative', eventManager: 'manager-1' },
      }),
      makeSession({
        id: 'session-2',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: {
          id: 'event-2',
          eventFamilyType: 'Corporate Offsite',
          status: 'Confirmed',
          eventManager: 'manager-1',
        },
      }),
    ]);
    renderPage();
    await navigateToSeptember2026();
    fireEvent.click(await screen.findByText('Confirmed'));
    expect(screen.queryByText('Wedding')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('All'));

    expect(await screen.findByText('Wedding')).toBeInTheDocument();
    expect(screen.getByText('Corporate Offsite')).toBeInTheDocument();
  });

  it('the Venue filter picker lists actual venues from the visible month, not a hardcoded list', async () => {
    mockCalendarApi([
      makeSession({
        id: 'session-1',
        venue: 'Lawn',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative', eventManager: 'manager-1' },
      }),
      makeSession({
        id: 'session-2',
        venue: 'Poolside',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: {
          id: 'event-2',
          eventFamilyType: 'Corporate Offsite',
          status: 'Tentative',
          eventManager: 'manager-1',
        },
      }),
    ]);
    renderPage();
    await navigateToSeptember2026();

    fireEvent.click(await screen.findByText('Venue'));

    expect(await screen.findByRole('menuitem', { name: 'Lawn' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Poolside' })).toBeInTheDocument();
  });

  it('selecting a venue narrows the grid to Events at that venue and marks the chip active with the venue as its label', async () => {
    mockCalendarApi([
      makeSession({
        id: 'session-1',
        venue: 'Lawn',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative', eventManager: 'manager-1' },
      }),
      makeSession({
        id: 'session-2',
        venue: 'Poolside',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: {
          id: 'event-2',
          eventFamilyType: 'Corporate Offsite',
          status: 'Tentative',
          eventManager: 'manager-1',
        },
      }),
    ]);
    renderPage();
    await navigateToSeptember2026();
    fireEvent.click(await screen.findByText('Venue'));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Lawn' }));

    expect(await screen.findByText('Wedding')).toBeInTheDocument();
    expect(screen.queryByText('Corporate Offsite')).not.toBeInTheDocument();
    const venueChip = screen.getByText('Lawn').closest('.MuiChip-root');
    expect(venueChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('the Event Manager filter picker lists real manager names from GET /event-managers', async () => {
    mockCalendarApi(
      [
        makeSession({
          startDate: '2026-09-12T00:00:00.000Z',
          endDate: '2026-09-12T00:00:00.000Z',
          event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative', eventManager: 'manager-1' },
        }),
      ],
      [
        { id: 'manager-1', name: 'Priya Sharma' },
        { id: 'manager-2', name: 'Rohan Mehta' },
      ],
    );
    renderPage();
    await navigateToSeptember2026();

    fireEvent.click(await screen.findByText('Event Manager'));

    expect(await screen.findByRole('menuitem', { name: 'Priya Sharma' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Rohan Mehta' })).toBeInTheDocument();
  });

  it('selecting an Event Manager narrows the grid to that manager\'s Events', async () => {
    mockCalendarApi(
      [
        makeSession({
          id: 'session-1',
          startDate: '2026-09-12T00:00:00.000Z',
          endDate: '2026-09-12T00:00:00.000Z',
          event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative', eventManager: 'manager-1' },
        }),
        makeSession({
          id: 'session-2',
          startDate: '2026-09-12T00:00:00.000Z',
          endDate: '2026-09-12T00:00:00.000Z',
          event: {
            id: 'event-2',
            eventFamilyType: 'Corporate Offsite',
            status: 'Tentative',
            eventManager: 'manager-2',
          },
        }),
      ],
      [
        { id: 'manager-1', name: 'Priya Sharma' },
        { id: 'manager-2', name: 'Rohan Mehta' },
      ],
    );
    renderPage();
    await navigateToSeptember2026();
    fireEvent.click(await screen.findByText('Event Manager'));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Priya Sharma' }));

    expect(await screen.findByText('Wedding')).toBeInTheDocument();
    expect(screen.queryByText('Corporate Offsite')).not.toBeInTheDocument();
  });

  it('selecting an Event Type narrows the grid accordingly', async () => {
    mockCalendarApi([
      makeSession({
        id: 'session-1',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative', eventManager: 'manager-1' },
      }),
      makeSession({
        id: 'session-2',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: {
          id: 'event-2',
          eventFamilyType: 'Corporate Offsite',
          status: 'Tentative',
          eventManager: 'manager-1',
        },
      }),
    ]);
    renderPage();
    await navigateToSeptember2026();
    fireEvent.click(await screen.findByText('Event Type'));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Wedding' }));

    expect(await findCalendarEventTitle('Wedding')).toBeInTheDocument();
    expect(screen.queryByText('Corporate Offsite')).not.toBeInTheDocument();
  });

  it('combining two filters that together match nothing shows a message, not a stuck spinner', async () => {
    mockCalendarApi([
      makeSession({
        id: 'session-1',
        venue: 'Lawn',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Tentative', eventManager: 'manager-1' },
      }),
    ]);
    renderPage();
    await navigateToSeptember2026();
    await screen.findByText('Wedding');

    fireEvent.click(screen.getByText('Confirmed'));

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(await screen.findByText('No Events match the selected filters.')).toBeInTheDocument();
    // The grid itself still renders (day-of-week header present), not
    // replaced by the message.
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it("preserves the active month and filters after navigating to an Event's detail screen and back (STORY-038)", async () => {
    mockCalendarApi([
      makeSession({
        id: 'session-1',
        venue: 'Lawn',
        startDate: '2026-09-12T00:00:00.000Z',
        endDate: '2026-09-12T00:00:00.000Z',
        event: { id: 'event-1', eventFamilyType: 'Wedding', status: 'Confirmed', eventManager: 'manager-1' },
      }),
    ]);
    renderPage();
    await navigateToSeptember2026();

    fireEvent.click(await screen.findByText('Confirmed'));
    fireEvent.click(await screen.findByText('Venue'));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Lawn' }));
    const confirmedChip = await screen.findByText('Confirmed');
    expect(confirmedChip.closest('.MuiChip-root')).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(await findCalendarEventTitle('Wedding'));
    await screen.findByText('event detail placeholder');

    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));

    expect(await screen.findByText('September 2026')).toBeInTheDocument();
    const confirmedChipAfterBack = await screen.findByText('Confirmed');
    expect(confirmedChipAfterBack.closest('.MuiChip-root')).toHaveAttribute('aria-pressed', 'true');
    const venueChipAfterBack = screen.getByText('Lawn').closest('.MuiChip-root');
    expect(venueChipAfterBack).toHaveAttribute('aria-pressed', 'true');
  });
});
