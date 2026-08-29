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

interface MockRoomLineInput {
  roomType: string;
  occupancy: number;
  tariff: number;
  noOfRooms: number;
}

interface MockRoomLine extends MockRoomLineInput {
  totalInclGst: number;
}

interface MockAccommodation {
  checkIn: string | null;
  checkOut: string | null;
  totalDays: number | null;
  roomLines: MockRoomLine[];
  totalOccupancy: number;
  totalCharges: number;
}

interface MockPayment {
  totalEstimatedAmount: number;
  advanceRequired: number;
  advancePaid: number;
  advancePaidDate: string | null;
  paymentMode: string | null;
  balance: number;
}

const makePayment = (overrides: Partial<MockPayment> = {}): MockPayment => ({
  totalEstimatedAmount: 0,
  advanceRequired: 0,
  advancePaid: 0,
  advancePaidDate: null,
  paymentMode: null,
  balance: 0,
  ...overrides,
});

// A plain-JS reimplementation of STORY-021's math, same reasoning as
// computeAccommodationResponse above.
const computePaymentResponse = (
  body: {
    totalEstimatedAmount?: number;
    advanceRequired?: number;
    advancePaid?: number;
    advancePaidDate?: string;
    paymentMode?: string;
  },
  current: MockPayment,
): MockPayment => {
  const totalEstimatedAmount = body.totalEstimatedAmount ?? current.totalEstimatedAmount;
  const advancePaid = body.advancePaid ?? current.advancePaid;
  return {
    totalEstimatedAmount,
    advanceRequired: body.advanceRequired ?? current.advanceRequired,
    advancePaid,
    advancePaidDate: body.advancePaidDate ?? current.advancePaidDate,
    paymentMode: body.paymentMode ?? current.paymentMode,
    balance: roundToCurrency(totalEstimatedAmount - advancePaid),
  };
};

interface MockEvent {
  id: string;
  eventId: string;
  eventFamilyType: string;
  status: string;
  eventManager: string;
  clientContacts: MockClientContact[];
  accommodation: MockAccommodation;
  payment: MockPayment;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const makeAccommodation = (overrides: Partial<MockAccommodation> = {}): MockAccommodation => ({
  checkIn: null,
  checkOut: null,
  totalDays: null,
  roomLines: [],
  totalOccupancy: 0,
  totalCharges: 0,
  ...overrides,
});

// A plain-JS reimplementation of STORY-018's math, just enough for the mock
// PATCH /events/:id/accommodation to behave like the real server — the
// point of these tests is verifying the UI renders whatever the response
// says, not re-testing the backend's own already-tested computation.
const GST_RATE = 18;
const roundToCurrency = (amount: number) => Math.round(amount * 100) / 100;
const computeAccommodationResponse = (
  body: { checkIn?: string; checkOut?: string; roomLines?: MockRoomLineInput[] },
  current: MockAccommodation,
): MockAccommodation => {
  const checkIn = body.checkIn ?? current.checkIn;
  const checkOut = body.checkOut ?? current.checkOut;
  const roomLines = (
    body.roomLines ?? current.roomLines.map(({ roomType, occupancy, tariff, noOfRooms }) => ({
      roomType,
      occupancy,
      tariff,
      noOfRooms,
    }))
  ).map((line) => ({ ...line, totalInclGst: roundToCurrency(line.tariff * line.noOfRooms * (1 + GST_RATE / 100)) }));

  return {
    checkIn,
    checkOut,
    totalDays:
      checkIn && checkOut
        ? Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) + 1
        : null,
    roomLines,
    totalOccupancy: roomLines.reduce((sum, line) => sum + line.occupancy * line.noOfRooms, 0),
    totalCharges: roundToCurrency(roomLines.reduce((sum, line) => sum + line.totalInclGst, 0)),
  };
};

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
  accommodation: makeAccommodation(),
  payment: makePayment(),
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
  const accommodationPatchRequests: Record<string, unknown>[] = [];
  const paymentPatchRequests: Record<string, unknown>[] = [];

  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (method === 'GET' && url.includes('/change-log')) {
        return jsonResponse(200, changeLogEntries);
      }
      if (method === 'PATCH' && currentEvent && url.endsWith(`/events/${currentEvent.id}/accommodation`)) {
        const body: { checkIn?: string; checkOut?: string; roomLines?: MockRoomLineInput[] } = JSON.parse(
          String(init?.body),
        );
        accommodationPatchRequests.push(body);
        currentEvent = {
          ...currentEvent,
          accommodation: computeAccommodationResponse(body, currentEvent.accommodation),
        };
        return jsonResponse(200, currentEvent.accommodation);
      }
      if (method === 'PATCH' && currentEvent && url.endsWith(`/events/${currentEvent.id}/payment`)) {
        const body: {
          totalEstimatedAmount?: number;
          advanceRequired?: number;
          advancePaid?: number;
          advancePaidDate?: string;
          paymentMode?: string;
        } = JSON.parse(String(init?.body));
        paymentPatchRequests.push(body);
        currentEvent = { ...currentEvent, payment: computePaymentResponse(body, currentEvent.payment) };
        return jsonResponse(200, currentEvent.payment);
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

  return {
    patchRequests,
    accommodationPatchRequests,
    paymentPatchRequests,
    getCurrentEvent: () => currentEvent,
  };
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

  it('renders the Rooms tab for a non-EventManager session too, unlike Activity', async () => {
    seedSession('Reception');
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    await screen.findByText('ARD-EVT-2026-001');
    expect(screen.getByRole('tab', { name: 'Rooms' })).toBeInTheDocument();
  });

  it('lets an Event Manager add a room line and save it, reflecting the new row and updated totals without a full page reload', async () => {
    seedSession();
    const { accommodationPatchRequests } = mockEventDetailApi({ event: makeEvent() });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Rooms' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add room line' }));

    fireEvent.change(screen.getByLabelText('Room type for room line 1'), { target: { value: 'Double' } });
    fireEvent.change(screen.getByLabelText('Occupancy for room line 1'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Tariff for room line 1'), { target: { value: '5000' } });
    fireEvent.change(screen.getByLabelText('Number of rooms for room line 1'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save accommodation' }));

    await waitFor(() => expect(accommodationPatchRequests).toHaveLength(1));
    expect(accommodationPatchRequests[0]?.roomLines).toEqual([
      { roomType: 'Double', occupancy: 2, tariff: 5000, noOfRooms: 1 },
    ]);
    // 5000 × 1 × 1.18 = 5900 — same render tree throughout, no full reload.
    expect(await screen.findByText('5900')).toBeInTheDocument();
    expect(await screen.findByText('Total charges: 5900')).toBeInTheDocument();
  });

  it("renders total_days/total_occupancy/total_charges/total_incl_gst read-only, never independently calculated from an unsaved edit", async () => {
    seedSession();
    mockEventDetailApi({
      event: makeEvent({
        accommodation: makeAccommodation({
          checkIn: '2026-06-15T00:00:00.000Z',
          checkOut: '2026-06-16T00:00:00.000Z',
          totalDays: 2,
          roomLines: [{ roomType: 'Double', occupancy: 2, tariff: 5000, noOfRooms: 1, totalInclGst: 5900 }],
          totalOccupancy: 2,
          totalCharges: 5900,
        }),
      }),
    });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Rooms' }));
    const tariffField = await screen.findByLabelText('Tariff for room line 1');
    expect(tariffField).toHaveValue(5000);

    // Edited locally, not saved — the read-only Total column and footer
    // totals must still reflect the last *server* response (5900), not a
    // client-side recalculation off the new, unsaved tariff.
    fireEvent.change(tariffField, { target: { value: '99999' } });

    expect(screen.getByText('5900')).toBeInTheDocument();
    expect(screen.getByText('Total charges: 5900')).toBeInTheDocument();
    expect(screen.getByText('Total occupancy: 2')).toBeInTheDocument();
    expect(screen.getByText('Total days: 2')).toBeInTheDocument();
    expect(screen.queryByText('99999')).not.toBeInTheDocument();
  });

  it('shows Rooms read-only, with no edit controls, for a non-EventManager session', async () => {
    seedSession('Reception');
    mockEventDetailApi({
      event: makeEvent({
        accommodation: makeAccommodation({
          roomLines: [{ roomType: 'Double', occupancy: 2, tariff: 5000, noOfRooms: 1, totalInclGst: 5900 }],
          totalOccupancy: 2,
          totalCharges: 5900,
        }),
      }),
    });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Rooms' }));

    expect(await screen.findByText(/Double.*2 occupancy.*1 rooms.*5900/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Tariff for room line/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add room line' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save accommodation' })).not.toBeInTheDocument();
  });

  it('does not render the Payments tab in the DOM at all for a non-EventManager session', async () => {
    seedSession('Reception');
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    await screen.findByText('ARD-EVT-2026-001');
    expect(screen.queryByRole('tab', { name: 'Payments' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Total estimated amount')).not.toBeInTheDocument();
  });

  it('lets an Event Manager save payment fields, updating the balance immediately without a full reload', async () => {
    seedSession();
    const { paymentPatchRequests } = mockEventDetailApi({ event: makeEvent() });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Payments' }));

    fireEvent.change(await screen.findByLabelText('Total estimated amount'), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText('Advance paid'), { target: { value: '20000' } });
    fireEvent.change(screen.getByLabelText('Payment mode'), { target: { value: 'UPI' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save payment' }));

    await waitFor(() => expect(paymentPatchRequests).toHaveLength(1));
    expect(paymentPatchRequests[0]).toMatchObject({
      totalEstimatedAmount: 50000,
      advancePaid: 20000,
      paymentMode: 'UPI',
    });
    // 50000 - 20000 = 30000 — same render tree throughout, no full reload.
    expect(await screen.findByText('30000')).toBeInTheDocument();
  });

  it('renders a negative balance from overpayment, matching STORY-022s response as-is', async () => {
    seedSession();
    mockEventDetailApi({
      event: makeEvent({
        payment: makePayment({ totalEstimatedAmount: 50000, advancePaid: 60000, balance: -10000 }),
      }),
    });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Payments' }));

    expect(await screen.findByText('-10000')).toBeInTheDocument();
  });
});
