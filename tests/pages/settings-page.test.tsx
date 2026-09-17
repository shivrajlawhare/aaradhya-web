import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import SettingsPage from '../../src/pages/settings/settings-page';
import { AuthProvider } from '../../src/stores/auth-context';
import { theme } from '../../src/theme/theme';
import { mockMatchMedia } from '../support/match-media';

interface MockVenue {
  id: string;
  name: string;
  defaultVenueCost: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MockEventType {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MockRoomType {
  id: string;
  name: string;
  defaultTariff: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MockMenuItem {
  id: string;
  name: string;
  defaultCostPerPlate: number;
  createdAt: string;
  updatedAt: string;
}

const NOW = '2026-01-01T00:00:00.000Z';

const makeVenue = (overrides: Partial<MockVenue> = {}): MockVenue => ({
  id: 'venue-1',
  name: 'Poolside',
  defaultVenueCost: 60000,
  active: true,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeEventType = (overrides: Partial<MockEventType> = {}): MockEventType => ({
  id: 'event-type-1',
  name: 'Wedding',
  active: true,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeRoomType = (overrides: Partial<MockRoomType> = {}): MockRoomType => ({
  id: 'room-type-1',
  name: 'Deluxe',
  defaultTariff: 2500,
  active: true,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeMenuItem = (overrides: Partial<MockMenuItem> = {}): MockMenuItem => ({
  id: 'menu-item-1',
  name: 'Paneer Tikka',
  defaultCostPerPlate: 250,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

// A tiny fetch router covering all four master lists — GET/POST on each
// collection, PATCH on the three that support it — backed by in-memory
// lists the test controls, plus a log of every URL/method hit so a test
// can assert a Venue/Room Type deactivation never touches anything
// Event/Session-shaped (this story's own called-out edge case).
const mockSettingsApi = (initial: {
  venues?: MockVenue[];
  eventTypes?: MockEventType[];
  roomTypes?: MockRoomType[];
  menuItems?: MockMenuItem[];
}) => {
  let venues = initial.venues ?? [];
  let eventTypes = initial.eventTypes ?? [];
  let roomTypes = initial.roomTypes ?? [];
  let menuItems = initial.menuItems ?? [];
  const requestLog: { method: string; url: string }[] = [];

  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      requestLog.push({ method, url });
      const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};

      if (method === 'GET' && url.endsWith('/venues')) {
        return jsonResponse(200, venues);
      }
      if (method === 'POST' && url.endsWith('/venues')) {
        const created: MockVenue = makeVenue({ ...body, id: `venue-${venues.length + 1}`, active: true });
        venues = [...venues, created];
        return jsonResponse(201, created);
      }
      if (method === 'PATCH' && url.includes('/venues/')) {
        const id = url.split('/venues/')[1];
        venues = venues.map((venue) => (venue.id === id ? { ...venue, ...body } : venue));
        return jsonResponse(200, venues.find((venue) => venue.id === id));
      }

      if (method === 'GET' && url.endsWith('/event-types')) {
        return jsonResponse(200, eventTypes);
      }
      if (method === 'POST' && url.endsWith('/event-types')) {
        const created: MockEventType = makeEventType({ ...body, id: `event-type-${eventTypes.length + 1}`, active: true });
        eventTypes = [...eventTypes, created];
        return jsonResponse(201, created);
      }
      if (method === 'PATCH' && url.includes('/event-types/')) {
        const id = url.split('/event-types/')[1];
        eventTypes = eventTypes.map((eventType) => (eventType.id === id ? { ...eventType, ...body } : eventType));
        return jsonResponse(200, eventTypes.find((eventType) => eventType.id === id));
      }

      if (method === 'GET' && url.endsWith('/room-types')) {
        return jsonResponse(200, roomTypes);
      }
      if (method === 'POST' && url.endsWith('/room-types')) {
        const created: MockRoomType = makeRoomType({ ...body, id: `room-type-${roomTypes.length + 1}`, active: true });
        roomTypes = [...roomTypes, created];
        return jsonResponse(201, created);
      }
      if (method === 'PATCH' && url.includes('/room-types/')) {
        const id = url.split('/room-types/')[1];
        roomTypes = roomTypes.map((roomType) => (roomType.id === id ? { ...roomType, ...body } : roomType));
        return jsonResponse(200, roomTypes.find((roomType) => roomType.id === id));
      }

      if (method === 'GET' && url.includes('/menu-items')) {
        return jsonResponse(200, menuItems);
      }
      if (method === 'POST' && url.endsWith('/menu-items')) {
        const created: MockMenuItem = makeMenuItem({ ...body, id: `menu-item-${menuItems.length + 1}` });
        menuItems = [...menuItems, created];
        return jsonResponse(201, created);
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    }),
  );

  return { requestLog };
};

const renderPage = () => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <MemoryRouter>
              <SettingsPage />
            </MemoryRouter>
          </AuthProvider>
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('SettingsPage', () => {
  describe('desktop (>=900px) — left-hand section list + table', () => {
    it('defaults to Venues, listing Name/Default Venue Cost/Status', async () => {
      mockMatchMedia(true);
      mockSettingsApi({ venues: [makeVenue({ name: 'Poolside', defaultVenueCost: 60000, active: true })] });
      renderPage();

      const row = (await screen.findByText('Poolside')).closest('tr');
      if (!row) {
        throw new Error('expected a row to render');
      }
      expect(within(row).getByText('60000')).toBeInTheDocument();
      expect(within(row).getByText('Active')).toBeInTheDocument();
    });

    it('switches sections via the left-hand list, e.g. to Event Types (no cost column)', async () => {
      mockMatchMedia(true);
      mockSettingsApi({
        venues: [makeVenue()],
        eventTypes: [makeEventType({ name: 'Corporate Offsite' })],
      });
      renderPage();
      await screen.findByText('Poolside');

      fireEvent.click(screen.getByRole('button', { name: 'Event Types' }));

      expect(await screen.findByText('Corporate Offsite')).toBeInTheDocument();
      expect(screen.queryByText('Default Venue Cost')).not.toBeInTheDocument();
      expect(screen.queryByText('Poolside')).not.toBeInTheDocument();
    });

    it('adds a new Venue via "+ Add" without a full page reload', async () => {
      mockMatchMedia(true);
      mockSettingsApi({ venues: [] });
      renderPage();
      await waitFor(() => expect(screen.getByRole('button', { name: 'Add Venue' })).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Add Venue' }));
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Lawn' } });
      fireEvent.change(screen.getByLabelText('Default Venue Cost'), { target: { value: '50000' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));

      expect(await screen.findByText('Lawn')).toBeInTheDocument();
      // The form closes itself after a successful add (same convention as
      // NewUserForm/UserManagementPage).
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    });

    it('offers no cost field on the Event Types "+ Add" form — that section has none', async () => {
      mockMatchMedia(true);
      mockSettingsApi({ eventTypes: [] });
      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: 'Event Types' }));

      fireEvent.click(await screen.findByRole('button', { name: 'Add Event Type' }));

      expect(await screen.findByLabelText('Name')).toBeInTheDocument();
      expect(screen.queryByLabelText(/Default/)).not.toBeInTheDocument();
    });

    it('flips a row to Inactive when the deactivate switch is toggled', async () => {
      mockMatchMedia(true);
      mockSettingsApi({ venues: [makeVenue({ active: true })] });
      renderPage();

      const row = (await screen.findByText('Poolside')).closest('tr');
      if (!row) {
        throw new Error('expected a row to render');
      }
      expect(within(row).getByText('Active')).toBeInTheDocument();

      fireEvent.click(within(row).getByRole('switch'));

      await waitFor(() => expect(within(row).getByText('Inactive')).toBeInTheDocument());
    });

    it('edits name and default cost via the Edit dialog', async () => {
      mockMatchMedia(true);
      mockSettingsApi({ venues: [makeVenue({ name: 'Poolside', defaultVenueCost: 60000 })] });
      renderPage();
      const row = (await screen.findByText('Poolside')).closest('tr');
      if (!row) {
        throw new Error('expected a row to render');
      }

      fireEvent.click(within(row).getByRole('button', { name: 'Edit Poolside' }));
      const nameField = await screen.findByLabelText('Name');
      expect(nameField).toHaveValue('Poolside');
      fireEvent.change(nameField, { target: { value: 'Poolside Deck' } });
      fireEvent.change(screen.getByLabelText('Default Venue Cost'), { target: { value: '65000' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(screen.getByText('Poolside Deck')).toBeInTheDocument());
      expect(screen.getByText('65000')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders the Menu Items section as add/browse-only — no Status column, no Edit, no toggle', async () => {
      mockMatchMedia(true);
      mockSettingsApi({ menuItems: [makeMenuItem({ name: 'Paneer Tikka', defaultCostPerPlate: 250 })] });
      renderPage();

      fireEvent.click(await screen.findByRole('button', { name: 'Menu Items' }));

      const row = (await screen.findByText('Paneer Tikka')).closest('tr');
      if (!row) {
        throw new Error('expected a row to render');
      }
      expect(within(row).getByText('250')).toBeInTheDocument();
      expect(within(row).queryByRole('switch')).not.toBeInTheDocument();
      expect(within(row).queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByText('Status')).not.toBeInTheDocument();
    });

    it('edge case: deactivating a Venue only PATCHes /venues/:id — no Event/Session/Calendar request', async () => {
      mockMatchMedia(true);
      const api = mockSettingsApi({ venues: [makeVenue({ id: 'venue-1', active: true })] });
      renderPage();

      const row = (await screen.findByText('Poolside')).closest('tr');
      if (!row) {
        throw new Error('expected a row to render');
      }
      fireEvent.click(within(row).getByRole('switch'));
      await waitFor(() => expect(within(row).getByText('Inactive')).toBeInTheDocument());

      const patchCalls = api.requestLog.filter((entry) => entry.method === 'PATCH');
      expect(patchCalls).toEqual([{ method: 'PATCH', url: expect.stringContaining('/venues/venue-1') }]);
      expect(api.requestLog.some((entry) => /\/events|\/calendar|\/sessions/.test(entry.url))).toBe(false);
    });
  });

  describe('mobile (<900px) — chip row + card list', () => {
    it('renders the section chip row instead of the desktop table', async () => {
      mockMatchMedia(false);
      mockSettingsApi({ venues: [makeVenue({ name: 'Poolside' })] });
      renderPage();

      await screen.findByText('Poolside');
      expect(screen.getByRole('tab', { name: 'Venues' })).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('shows name + default cost + status on each card', async () => {
      mockMatchMedia(false);
      mockSettingsApi({ roomTypes: [makeRoomType({ name: 'Deluxe', defaultTariff: 2500, active: false })] });
      renderPage();

      fireEvent.click(await screen.findByRole('tab', { name: 'Room Types' }));

      const card = (await screen.findByText('Deluxe')).closest('.MuiPaper-root');
      if (!card) {
        throw new Error('expected a card to render');
      }
      expect(within(card as HTMLElement).getByText(/2500/)).toBeInTheDocument();
      expect(within(card as HTMLElement).getByText('Inactive')).toBeInTheDocument();
    });

    it('toggles the add form open/closed via the full-width Add button', async () => {
      mockMatchMedia(false);
      mockSettingsApi({ venues: [] });
      renderPage();

      const addButton = await screen.findByRole('button', { name: 'Add Venue' });
      expect(addButton).toHaveClass('MuiButton-fullWidth');
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();

      fireEvent.click(addButton);
      expect(await screen.findByLabelText('Name')).toBeInTheDocument();

      fireEvent.click(addButton);
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    });

    it('Menu Items cards have no Edit action or toggle', async () => {
      mockMatchMedia(false);
      mockSettingsApi({ menuItems: [makeMenuItem({ name: 'Paneer Tikka' })] });
      renderPage();

      fireEvent.click(await screen.findByRole('tab', { name: 'Menu Items' }));

      const card = (await screen.findByText('Paneer Tikka')).closest('.MuiPaper-root') as HTMLElement | null;
      if (!card) {
        throw new Error('expected a card to render');
      }
      expect(within(card).queryByRole('switch')).not.toBeInTheDocument();
      expect(within(card).queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
