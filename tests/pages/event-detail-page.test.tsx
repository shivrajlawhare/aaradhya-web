import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import EventDetailPage from '../../src/pages/event-detail/event-detail-page';
import { EVENT_DETAIL_PATH_PATTERN, eventDetailPath } from '../../src/routes';
import { AuthProvider, SESSION_STORAGE_KEY } from '../../src/stores/auth-context';
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

interface MockChangeLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: string;
  timestamp: string;
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

const seedSession = (role = 'EventManager') => {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ token: 'signed-jwt', user: { id: 'manager-1', name: 'Priya Nair', role } }),
  );
};

const mockEventDetailApi = ({
  event,
  changeLogEntries = [],
  notFound = false,
}: {
  event?: MockEvent;
  changeLogEntries?: MockChangeLogEntry[];
  notFound?: boolean;
}) => {
  let currentEvent = event;
  const patchRequests: Record<string, unknown>[] = [];

  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (method === 'GET' && url.includes('/change-log')) {
        return jsonResponse(200, changeLogEntries);
      }
      if (method === 'PATCH' && currentEvent && url.endsWith(`/events/${currentEvent.id}`)) {
        const body: Record<string, unknown> = JSON.parse(String(init?.body));
        patchRequests.push(body);
        currentEvent = { ...currentEvent, ...body } as MockEvent;
        return jsonResponse(200, currentEvent);
      }
      if (method === 'GET' && /\/events\/[^/]+$/.test(url)) {
        if (notFound || !currentEvent) {
          return jsonResponse(404, { error: { code: 'EVENT_NOT_FOUND', message: 'No Event with that id.' } });
        }
        return jsonResponse(200, currentEvent);
      }
      throw new Error(`Unhandled request: ${method} ${url}`);
    }),
  );

  return { patchRequests, getCurrentEvent: () => currentEvent };
};

const renderPage = (id = 'event-1') => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <MemoryRouter initialEntries={[eventDetailPath(id)]}>
              <Routes>
                <Route path={EVENT_DETAIL_PATH_PATTERN} element={<EventDetailPage />} />
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

describe('EventDetailPage', () => {
  it('shows event_id, status chip, and family type in the header', async () => {
    seedSession();
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    expect(await screen.findByText('ARD-EVT-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Tentative', { selector: '.MuiChip-label' })).toBeInTheDocument();
    expect(screen.getByText('Wedding')).toBeInTheDocument();
  });

  it('shows a 404 state, not a crash, for a nonexistent Event id', async () => {
    seedSession();
    mockEventDetailApi({ notFound: true });
    renderPage('missing-event');

    expect(await screen.findByText('No Event with that id.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Events' })).toBeInTheDocument();
  });

  it('lets an Event Manager move status to any of the four values, persisting via PATCH', async () => {
    seedSession();
    const { patchRequests } = mockEventDetailApi({ event: makeEvent() });
    renderPage();

    const statusSelect = await screen.findByRole('combobox', { name: 'Status' });
    fireEvent.mouseDown(statusSelect);
    fireEvent.click(screen.getByRole('option', { name: 'Completed' }));

    await waitFor(() => expect(patchRequests).toHaveLength(1));
    expect(patchRequests[0]).toEqual({ status: 'Completed' });
  });

  it('stays fully editable after switching status to Cancelled and back', async () => {
    seedSession();
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    const statusSelect = await screen.findByRole('combobox', { name: 'Status' });
    fireEvent.mouseDown(statusSelect);
    fireEvent.click(screen.getByRole('option', { name: 'Cancelled' }));
    await waitFor(() => expect(statusSelect).toHaveTextContent('Cancelled'));

    fireEvent.mouseDown(statusSelect);
    fireEvent.click(screen.getByRole('option', { name: 'Confirmed' }));
    await waitFor(() => expect(statusSelect).toHaveTextContent('Confirmed'));

    // Still fully interactive — not disabled, not locked out.
    expect(statusSelect).not.toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Add contact' })).toBeEnabled();
  });

  it('lets an Event Manager edit a Client Contact row and persist it via Save contacts', async () => {
    seedSession();
    const { patchRequests } = mockEventDetailApi({ event: makeEvent() });
    renderPage();

    const nameField = await screen.findByDisplayValue('Priya Nair');
    fireEvent.change(nameField, { target: { value: 'Priya Sharma' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save contacts' }));

    await waitFor(() => expect(patchRequests).toHaveLength(1));
    const contacts = patchRequests[0]?.clientContacts as { name: string }[];
    expect(contacts.map((contact) => contact.name)).toEqual(['Priya Sharma', 'Rohan Nair']);
  });

  it('renders a real Change Log entry on the Activity tab after an edit made on this screen', async () => {
    seedSession();
    const { getCurrentEvent } = mockEventDetailApi({
      event: makeEvent(),
      changeLogEntries: [],
    });
    renderPage();

    const statusSelect = await screen.findByRole('combobox', { name: 'Status' });
    fireEvent.mouseDown(statusSelect);
    fireEvent.click(screen.getByRole('option', { name: 'Confirmed' }));
    await waitFor(() => expect(statusSelect).toHaveTextContent('Confirmed'));

    // The mocked API now "has" a change — simulate the Activity endpoint
    // reflecting it, the same way the real backend would after STORY-014's
    // PATCH calls STORY-008's logChange.
    const current = getCurrentEvent();
    mockEventDetailApi({
      event: current,
      changeLogEntries: [
        {
          id: 'entry-1',
          entityType: 'Event',
          entityId: 'event-1',
          field: 'status',
          oldValue: 'Tentative',
          newValue: 'Confirmed',
          changedBy: 'manager-1',
          timestamp: new Date().toISOString(),
        },
      ],
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));

    expect(await screen.findByText('status: Tentative → Confirmed')).toBeInTheDocument();
  });

  it('does not render the Activity tab for a non-EventManager session', async () => {
    seedSession('Reception');
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    await screen.findByText('ARD-EVT-2026-001');
    expect(screen.queryByRole('tab', { name: 'Activity' })).not.toBeInTheDocument();
  });

  it('shows Client Contacts read-only, with no edit controls, for a non-EventManager session', async () => {
    seedSession('Reception');
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    await screen.findByText('ARD-EVT-2026-001');
    expect(screen.getByText(/Priya Nair.*9876543210.*Bride/)).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Status' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add contact' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save contacts' })).not.toBeInTheDocument();
  });
});
