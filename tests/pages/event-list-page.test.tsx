import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import EventListPage from '../../src/pages/event-list/event-list-page';
import { EVENT_DETAIL_PATH_PATTERN, EVENT_LIST_PATH } from '../../src/routes';
import { AuthProvider, SESSION_STORAGE_KEY } from '../../src/stores/auth-context';
import { colorTokens } from '../../src/theme/tokens';
import { theme } from '../../src/theme/theme';
import { mockMatchMedia } from '../support/match-media';

interface MockClientContact {
  name: string;
  contactNumber: string;
  role: string;
}

interface MockEvent {
  id: string;
  eventId: string;
  eventFamilyType: string;
  status: string;
  eventManager: string;
  clientContacts: MockClientContact[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const makeEvent = (overrides: Partial<MockEvent> = {}): MockEvent => ({
  id: 'event-1',
  eventId: 'ARD-EVT-2026-001',
  eventFamilyType: 'Wedding',
  status: 'Tentative',
  eventManager: 'manager-1',
  clientContacts: [
    { name: 'Priya Nair', contactNumber: '9876543210', role: 'Bride' },
    { name: 'Rohan Nair', contactNumber: '9123456780', role: 'Groom' },
  ],
  createdBy: 'manager-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  );

const mockEventsApi = (events: MockEvent[]) => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/events')) {
        return jsonResponse(200, events);
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
            <MemoryRouter initialEntries={[EVENT_LIST_PATH]}>
              <Routes>
                <Route path={EVENT_LIST_PATH} element={<EventListPage />} />
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

describe('EventListPage', () => {
  describe('desktop (>=900px) — EventsTable, unchanged (STORY-055)', () => {
    it('renders event_id, family type, manager, and Bride/Groom names per row', async () => {
      mockMatchMedia(true);
      mockEventsApi([makeEvent()]);
      renderPage();

      const row = (await screen.findByText('ARD-EVT-2026-001')).closest('tr');
      if (!row) {
        throw new Error('expected a row to render');
      }
      expect(within(row).getByText('Wedding')).toBeInTheDocument();
      expect(within(row).getByText('manager-1')).toBeInTheDocument();
      expect(within(row).getByText('Priya Nair & Rohan Nair')).toBeInTheDocument();
    });

    it('renders "—" for Bride/Groom when neither role is present', async () => {
      mockMatchMedia(true);
      mockEventsApi([
        makeEvent({
          clientContacts: [{ name: 'Office POC', contactNumber: '9000000000', role: 'POC' }],
        }),
      ]);
      renderPage();

      await screen.findByText('ARD-EVT-2026-001');
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders a plain empty state, not a blank screen, when there are no Events', async () => {
      mockMatchMedia(true);
      mockEventsApi([]);
      renderPage();

      expect(await screen.findByText('No Events yet')).toBeInTheDocument();
    });

    it('navigates to the Event detail screen when a row is clicked', async () => {
      mockMatchMedia(true);
      mockEventsApi([makeEvent({ id: 'event-42' })]);
      renderPage();

      const row = (await screen.findByText('ARD-EVT-2026-001')).closest('tr');
      if (!row) {
        throw new Error('expected a row to render');
      }
      fireEvent.click(row);

      await screen.findByText('event detail placeholder');
    });

    it('truncates a very long custom family-type value instead of breaking the row layout', async () => {
      mockMatchMedia(true);
      const longFamilyType = 'A'.repeat(300);
      mockEventsApi([makeEvent({ eventFamilyType: longFamilyType })]);
      renderPage();

      const cell = await screen.findByTitle(longFamilyType);
      expect(cell).toHaveStyle({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
    });

    it.each([
      ['Tentative', colorTokens.statusTentativeTint],
      ['Confirmed', colorTokens.statusConfirmedTint],
      ['Completed', colorTokens.statusCompletedTint],
      ['Cancelled', colorTokens.statusCancelledTint],
    ])('renders the %s status chip with its own status color, not a shared default', async (status, tint) => {
      mockMatchMedia(true);
      mockEventsApi([makeEvent({ status })]);
      renderPage();

      const chipLabel = await screen.findByText(status);
      const chip = chipLabel.closest('.MuiChip-root');
      if (!chip) {
        throw new Error('expected a MuiChip-root ancestor');
      }
      await waitFor(() => expect(chip).toHaveStyle({ backgroundColor: tint }));
    });
  });

  describe('mobile (<900px) — EventsCardList (STORY-055)', () => {
    it('renders family type and StatusChip on the same top row, Event ID below, and Bride/Groom · Manager on the last line', async () => {
      mockMatchMedia(false);
      mockEventsApi([makeEvent()]);
      renderPage();

      const card = (await screen.findByText('ARD-EVT-2026-001')).closest('.MuiPaper-root') as HTMLElement | null;
      if (!card) {
        throw new Error('expected a card to render');
      }
      expect(within(card).getByText('Wedding')).toBeInTheDocument();
      expect(within(card).getByText('Tentative', { selector: '.MuiChip-label' })).toBeInTheDocument();
      expect(within(card).getByText('Priya Nair & Rohan Nair · manager-1')).toBeInTheDocument();
    });

    it('renders "—" for Bride/Groom when neither role is present, same helper as the desktop table', async () => {
      mockMatchMedia(false);
      mockEventsApi([
        makeEvent({
          clientContacts: [{ name: 'Office POC', contactNumber: '9000000000', role: 'POC' }],
        }),
      ]);
      renderPage();

      expect(await screen.findByText('— · manager-1')).toBeInTheDocument();
    });

    it('renders a plain empty-state card, not a blank screen, when there are no Events', async () => {
      mockMatchMedia(false);
      mockEventsApi([]);
      renderPage();

      expect(await screen.findByText('No Events yet')).toBeInTheDocument();
    });

    it('navigates to the Event detail screen when a card is clicked', async () => {
      mockMatchMedia(false);
      mockEventsApi([makeEvent({ id: 'event-42' })]);
      renderPage();

      fireEvent.click(await screen.findByRole('link', { name: 'Open Event ARD-EVT-2026-001' }));

      await screen.findByText('event detail placeholder');
    });

    it('activates a card via the Enter key, same as the desktop table row', async () => {
      mockMatchMedia(false);
      mockEventsApi([makeEvent({ id: 'event-42' })]);
      renderPage();

      const card = await screen.findByRole('link', { name: 'Open Event ARD-EVT-2026-001' });
      fireEvent.keyDown(card, { key: 'Enter' });

      await screen.findByText('event detail placeholder');
    });

    it('wraps a very long Bride/Groom name instead of overflowing the card', async () => {
      const longName = 'A'.repeat(300);
      mockMatchMedia(false);
      mockEventsApi([
        makeEvent({ clientContacts: [{ name: longName, contactNumber: '9000000000', role: 'Bride' }] }),
      ]);
      renderPage();

      const line = await screen.findByText(`${longName} · manager-1`);
      expect(line).toHaveStyle({ overflowWrap: 'anywhere' });
    });

    it('does not render EventsTable at all on mobile', async () => {
      mockMatchMedia(false);
      mockEventsApi([makeEvent()]);
      renderPage();

      await screen.findByText('ARD-EVT-2026-001');
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('"+ New Event" action', () => {
    it('renders full-width above the card list on mobile, for an Event Manager', async () => {
      mockMatchMedia(false);
      seedSession('EventManager');
      mockEventsApi([]);
      renderPage();

      const button = await screen.findByRole('link', { name: 'New Event' });
      expect(button).toHaveClass('MuiButton-fullWidth');
    });

    it('renders without the fullWidth class on desktop, for an Event Manager', async () => {
      mockMatchMedia(true);
      seedSession('EventManager');
      mockEventsApi([]);
      renderPage();

      const button = await screen.findByRole('link', { name: 'New Event' });
      expect(button).not.toHaveClass('MuiButton-fullWidth');
    });

    it('does not render for a non-Event-Manager role', async () => {
      mockMatchMedia(false);
      seedSession('Reception');
      mockEventsApi([]);
      renderPage();

      await screen.findByText('No Events yet');
      expect(screen.queryByRole('link', { name: 'New Event' })).not.toBeInTheDocument();
    });

    it('links to the New Event route', async () => {
      mockMatchMedia(true);
      seedSession('EventManager');
      mockEventsApi([]);
      renderPage();

      const button = await screen.findByRole('link', { name: 'New Event' });
      expect(button).toHaveAttribute('href', '/events/new');
    });
  });
});
