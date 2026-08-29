import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import EventListPage from '../../src/pages/event-list/event-list-page';
import { EVENT_DETAIL_PATH_PATTERN, EVENT_LIST_PATH } from '../../src/routes';
import { colorTokens } from '../../src/theme/tokens';
import { theme } from '../../src/theme/theme';

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

const renderPage = () => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[EVENT_LIST_PATH]}>
            <Routes>
              <Route path={EVENT_LIST_PATH} element={<EventListPage />} />
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

describe('EventListPage', () => {
  it('renders event_id, family type, manager, and Bride/Groom names per row', async () => {
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
    mockEventsApi([]);
    renderPage();

    expect(await screen.findByText('No Events yet')).toBeInTheDocument();
  });

  it('navigates to the Event detail screen when a row is clicked', async () => {
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
