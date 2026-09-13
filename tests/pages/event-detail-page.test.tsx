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

interface MockExtras {
  decoration: number;
  photographer: number;
  bhatji: number;
}

const makeExtras = (overrides: Partial<MockExtras> = {}): MockExtras => ({
  decoration: 0,
  photographer: 0,
  bhatji: 0,
  ...overrides,
});

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

interface MockDocumentsChecklist {
  aadharCard: boolean;
  panCard: boolean;
  leavingBirthCertificate: boolean;
  rationCard: boolean;
  passportPhotos: boolean;
  weddingCard: boolean;
}

const makeDocumentsChecklist = (overrides: Partial<MockDocumentsChecklist> = {}): MockDocumentsChecklist => ({
  aadharCard: false,
  panCard: false,
  leavingBirthCertificate: false,
  rationCard: false,
  passportPhotos: false,
  weddingCard: false,
  ...overrides,
});

interface MockSessionSetup {
  seating: string | null;
  tableCount: number;
  chairCount: number;
  stage: boolean;
  buffet: boolean;
  registrationDesk: boolean;
  vipSeating: boolean;
  brideGroomSeating: boolean;
  notes: string | null;
}

const makeSessionSetup = (overrides: Partial<MockSessionSetup> = {}): MockSessionSetup => ({
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

interface MockSession {
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
  setup: MockSessionSetup;
  items: MockItem[];
}

// A plain-JS reimplementation of STORY-026's math, same reasoning as
// computeAccommodationResponse above.
const computeSessionDurationDays = (startDate: string, endDate: string) =>
  Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1;

interface MockMenuItem {
  id: string;
  name: string;
  defaultCostPerPlate: number;
  createdAt: string;
  updatedAt: string;
}

const makeMenuItem = (overrides: Partial<MockMenuItem> & { id: string }): MockMenuItem => ({
  name: 'Menu Item',
  defaultCostPerPlate: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

interface MockItem {
  id: string;
  type: string;
  mealName: string | null;
  pax: number | null;
  costPerPlate: number | null;
  menuItems: string[];
  eventName: string | null;
  venue: string | null;
  startTime: string | null;
  endTime: string | null;
  totalCost: number | null;
}

const makeMealItem = (overrides: Partial<MockItem> & { id: string }): MockItem => ({
  type: 'Meal',
  mealName: 'Lunch',
  pax: 100,
  costPerPlate: 500,
  menuItems: [],
  eventName: null,
  venue: null,
  startTime: null,
  endTime: null,
  totalCost: 50000,
  ...overrides,
});

interface MockEvent {
  id: string;
  eventId: string;
  eventFamilyType: string;
  status: string;
  eventManager: string;
  clientContacts: MockClientContact[];
  accommodation: MockAccommodation;
  payment: MockPayment;
  documentsChecklist: MockDocumentsChecklist;
  extras: MockExtras;
  sessions: MockSession[];
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

// A plain-JS reimplementation of STORY-031's math, same reasoning as
// computeAccommodationResponse above.
const computeItemTotalCost = (pax: number | null, costPerPlate: number | null): number | null =>
  pax === null || costPerPlate === null ? null : roundToCurrency(pax * costPerPlate);

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

// A plain-JS reimplementation of STORY-039's math, same reasoning as
// computeAccommodationResponse above — only Active sessions and Meal Items
// count toward venue/food totals (STORY-041's own Cancelled-exclusion
// decision), reusing each item's already-mocked totalCost rather than
// redoing pax × cost_per_plate.
const computeQuotationSummary = (event: MockEvent) => {
  const activeSessions = event.sessions.filter((session) => session.sessionStatus === 'Active');
  const venueTotal = roundToCurrency(activeSessions.reduce((sum, session) => sum + session.venueCost, 0));
  const foodSubtotal = roundToCurrency(
    activeSessions.reduce(
      (sum, session) =>
        sum +
        session.items
          .filter((item) => item.type === 'Meal')
          .reduce((itemSum, item) => itemSum + (item.totalCost ?? 0), 0),
      0,
    ),
  );
  const foodTotalInclGst = roundToCurrency(foodSubtotal * (1 + GST_RATE / 100));
  const accommodationTotal = event.accommodation.totalCharges;
  const extrasTotal = roundToCurrency(event.extras.decoration + event.extras.photographer + event.extras.bhatji);
  return {
    venueTotal,
    foodSubtotal,
    foodTotalInclGst,
    accommodationTotal,
    extrasTotal,
    grandTotal: roundToCurrency(venueTotal + foodTotalInclGst + accommodationTotal + extrasTotal),
  };
};

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
  documentsChecklist: makeDocumentsChecklist(),
  extras: makeExtras(),
  sessions: [],
  createdBy: 'manager-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  );

// A real (if fake) PDF magic-byte payload — the button's own code only
// cares that this resolves as a Blob via response.blob(), not that it's a
// valid PDF; the actual rendering is aaradhya-api's own STORY-043 concern.
const pdfResponse = (status: number) =>
  Promise.resolve(
    new Response(status === 200 ? '%PDF-1.4 fake' : JSON.stringify({ error: { code: 'ERROR', message: 'Failed.' } }), {
      status,
      headers: { 'content-type': status === 200 ? 'application/pdf' : 'application/json' },
    }),
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
  menuItems = [],
  notFound = false,
}: {
  event?: MockEvent;
  changeLogEntries?: MockChangeLogEntry[];
  menuItems?: MockMenuItem[];
  notFound?: boolean;
}) => {
  let currentEvent = event;
  let currentMenuItems = menuItems;
  const patchRequests: Record<string, unknown>[] = [];
  const accommodationPatchRequests: Record<string, unknown>[] = [];
  const paymentPatchRequests: Record<string, unknown>[] = [];
  const documentsChecklistPatchRequests: Record<string, unknown>[] = [];
  const extrasPatchRequests: Record<string, unknown>[] = [];
  let pdfRequestCount = 0;
  const sessionPostRequests: Record<string, unknown>[] = [];
  const sessionPatchRequests: Record<string, unknown>[] = [];
  const itemPostRequests: Record<string, unknown>[] = [];
  const itemPatchRequests: Record<string, unknown>[] = [];
  let sessionIdCounter = 0;
  let itemIdCounter = 0;
  let menuItemIdCounter = 0;

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
      if (method === 'PATCH' && currentEvent && url.endsWith(`/events/${currentEvent.id}/documents`)) {
        const body: Partial<MockDocumentsChecklist> = JSON.parse(String(init?.body));
        documentsChecklistPatchRequests.push(body);
        currentEvent = { ...currentEvent, documentsChecklist: { ...currentEvent.documentsChecklist, ...body } };
        return jsonResponse(200, currentEvent.documentsChecklist);
      }
      if (method === 'PATCH' && currentEvent && url.endsWith(`/events/${currentEvent.id}/extras`)) {
        const body: Partial<MockExtras> = JSON.parse(String(init?.body));
        extrasPatchRequests.push(body);
        currentEvent = { ...currentEvent, extras: { ...currentEvent.extras, ...body } };
        return jsonResponse(200, currentEvent.extras);
      }
      if (method === 'GET' && currentEvent && url.endsWith(`/events/${currentEvent.id}/quotation-summary`)) {
        return jsonResponse(200, computeQuotationSummary(currentEvent));
      }
      if (method === 'GET' && currentEvent && url.endsWith(`/events/${currentEvent.id}/quotation.pdf`)) {
        pdfRequestCount += 1;
        return pdfResponse(200);
      }
      if (method === 'GET' && url.includes('/menu-items')) {
        const search = new URL(url).searchParams.get('search')?.trim().toLowerCase() ?? '';
        const results = search
          ? currentMenuItems.filter((item) => item.name.toLowerCase().includes(search))
          : currentMenuItems;
        return jsonResponse(200, results);
      }
      // Checked ahead of the session POST/PATCH handlers below — a plain
      // `url.includes('/sessions/')` (the session PATCH handler's own
      // check) would otherwise also match these deeper Item URLs, since
      // `/events/X/sessions/Y/items/Z` still contains that substring.
      if (method === 'POST' && currentEvent && /\/events\/[^/]+\/sessions\/[^/]+\/items$/.test(url)) {
        const sid = url.split('/sessions/')[1]?.split('/items')[0];
        const body: {
          type: string;
          mealName?: string;
          pax?: number;
          costPerPlate?: number;
          menuItems?: ({ id: string } | { name: string })[];
          eventName?: string;
          venue?: string;
          startTime?: string;
          endTime?: string;
        } = JSON.parse(String(init?.body));
        itemPostRequests.push(body);
        const resolvedMenuItemIds = (body.menuItems ?? []).map((ref) => {
          if ('id' in ref) {
            return ref.id;
          }
          const existing = currentMenuItems.find((item) => item.name.toLowerCase() === ref.name.toLowerCase());
          if (existing) {
            return existing.id;
          }
          menuItemIdCounter += 1;
          const created = makeMenuItem({ id: `menu-item-${menuItemIdCounter}`, name: ref.name });
          currentMenuItems = [...currentMenuItems, created];
          return created.id;
        });
        itemIdCounter += 1;
        const pax = body.type === 'Meal' ? (body.pax ?? 0) : null;
        const costPerPlate = body.type === 'Meal' ? (body.costPerPlate ?? 0) : null;
        const newItem: MockItem = {
          id: `item-${itemIdCounter}`,
          type: body.type,
          mealName: body.type === 'Meal' ? (body.mealName ?? '') : null,
          pax,
          costPerPlate,
          menuItems: body.type === 'Meal' ? resolvedMenuItemIds : [],
          eventName: body.type === 'Event' ? (body.eventName ?? '') : null,
          venue: body.type === 'Event' ? (body.venue ?? '') : null,
          startTime: body.startTime ?? null,
          endTime: body.endTime ?? null,
          totalCost: computeItemTotalCost(pax, costPerPlate),
        };
        currentEvent = {
          ...currentEvent,
          sessions: currentEvent.sessions.map((session) =>
            session.id === sid ? { ...session, items: [...session.items, newItem] } : session,
          ),
        };
        return jsonResponse(201, newItem);
      }
      if (method === 'PATCH' && currentEvent && /\/events\/[^/]+\/sessions\/[^/]+\/items\/[^/]+$/.test(url)) {
        const [, sid, iid] = /\/sessions\/([^/]+)\/items\/([^/]+)$/.exec(url) ?? [];
        const body: Partial<{
          mealName: string;
          pax: number;
          costPerPlate: number;
          menuItems: ({ id: string } | { name: string })[];
          eventName: string;
          venue: string;
          startTime: string;
          endTime: string;
        }> = JSON.parse(String(init?.body));
        itemPatchRequests.push(body);
        const session = currentEvent.sessions.find((candidate) => candidate.id === sid);
        const existingItem = session?.items.find((candidate) => candidate.id === iid);
        if (!session || !existingItem) {
          return jsonResponse(404, {
            error: { code: 'ITEM_NOT_FOUND', message: 'No Item with that id on this Session.' },
          });
        }
        const resolvedMenuItemIds =
          body.menuItems === undefined
            ? existingItem.menuItems
            : body.menuItems.map((ref) => {
                if ('id' in ref) {
                  return ref.id;
                }
                const existing = currentMenuItems.find(
                  (item) => item.name.toLowerCase() === ref.name.toLowerCase(),
                );
                if (existing) {
                  return existing.id;
                }
                menuItemIdCounter += 1;
                const created = makeMenuItem({ id: `menu-item-${menuItemIdCounter}`, name: ref.name });
                currentMenuItems = [...currentMenuItems, created];
                return created.id;
              });
        const pax = body.pax ?? existingItem.pax;
        const costPerPlate = body.costPerPlate ?? existingItem.costPerPlate;
        const updatedItem: MockItem = {
          ...existingItem,
          ...body,
          menuItems: resolvedMenuItemIds,
          totalCost: computeItemTotalCost(pax, costPerPlate),
        };
        currentEvent = {
          ...currentEvent,
          sessions: currentEvent.sessions.map((candidate) =>
            candidate.id === sid
              ? {
                  ...candidate,
                  items: candidate.items.map((item) => (item.id === iid ? updatedItem : item)),
                }
              : candidate,
          ),
        };
        return jsonResponse(200, updatedItem);
      }
      if (method === 'DELETE' && currentEvent && /\/events\/[^/]+\/sessions\/[^/]+\/items\/[^/]+$/.test(url)) {
        const [, sid, iid] = /\/sessions\/([^/]+)\/items\/([^/]+)$/.exec(url) ?? [];
        currentEvent = {
          ...currentEvent,
          sessions: currentEvent.sessions.map((candidate) =>
            candidate.id === sid
              ? { ...candidate, items: candidate.items.filter((item) => item.id !== iid) }
              : candidate,
          ),
        };
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (method === 'POST' && currentEvent && url.endsWith(`/events/${currentEvent.id}/sessions`)) {
        const body: {
          sessionType: string;
          venue: string;
          venueCost?: number;
          startDate: string;
          endDate: string;
          startTime?: string;
          endTime?: string;
          pax?: number;
          setup?: Partial<MockSessionSetup>;
        } = JSON.parse(String(init?.body));
        sessionPostRequests.push(body);
        sessionIdCounter += 1;
        const newSession: MockSession = {
          id: `session-${sessionIdCounter}`,
          sessionType: body.sessionType,
          venue: body.venue,
          venueCost: body.venueCost ?? 0,
          startDate: body.startDate,
          endDate: body.endDate,
          startTime: body.startTime ?? null,
          endTime: body.endTime ?? null,
          pax: body.pax ?? 0,
          sessionStatus: 'Active',
          durationDays: computeSessionDurationDays(body.startDate, body.endDate),
          isMultiDay: computeSessionDurationDays(body.startDate, body.endDate) > 1,
          setup: makeSessionSetup(body.setup),
          items: [],
        };
        currentEvent = { ...currentEvent, sessions: [...currentEvent.sessions, newSession] };
        return jsonResponse(201, newSession);
      }
      if (method === 'PATCH' && currentEvent && url.includes(`/events/${currentEvent.id}/sessions/`)) {
        const sid = url.split('/sessions/')[1];
        const body: Partial<{
          sessionType: string;
          venue: string;
          venueCost: number;
          startDate: string;
          endDate: string;
          startTime: string;
          endTime: string;
          pax: number;
          sessionStatus: string;
          setup: Partial<MockSessionSetup>;
        }> = JSON.parse(String(init?.body));
        sessionPatchRequests.push(body);
        const existingSession = currentEvent.sessions.find((session) => session.id === sid);
        if (!existingSession) {
          return jsonResponse(404, {
            error: { code: 'SESSION_NOT_FOUND', message: 'No Session with that id on this Event.' },
          });
        }
        const nextStartDate = body.startDate ?? existingSession.startDate;
        const nextEndDate = body.endDate ?? existingSession.endDate;
        if (nextEndDate < nextStartDate) {
          return jsonResponse(400, {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body.',
              details: [{ field: 'endDate', message: 'end_date must be on or after start_date.' }],
            },
          });
        }
        const updatedSession: MockSession = {
          ...existingSession,
          ...body,
          setup: body.setup ? { ...existingSession.setup, ...body.setup } : existingSession.setup,
          durationDays: computeSessionDurationDays(nextStartDate, nextEndDate),
          isMultiDay: computeSessionDurationDays(nextStartDate, nextEndDate) > 1,
        };
        currentEvent = {
          ...currentEvent,
          sessions: currentEvent.sessions.map((session) => (session.id === sid ? updatedSession : session)),
        };
        return jsonResponse(200, updatedSession);
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
    documentsChecklistPatchRequests,
    extrasPatchRequests,
    sessionPostRequests,
    sessionPatchRequests,
    itemPostRequests,
    itemPatchRequests,
    getCurrentEvent: () => currentEvent,
    getCurrentMenuItems: () => currentMenuItems,
    getPdfRequestCount: () => pdfRequestCount,
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

  it('renders the Total Cost Summary rollup as read-only text, sourced from the live quotation-summary endpoint', async () => {
    seedSession();
    mockEventDetailApi({
      event: makeEvent({
        accommodation: makeAccommodation({ totalCharges: 11800 }),
        extras: makeExtras({ decoration: 1000, photographer: 1500, bhatji: 500 }),
        sessions: [
          {
            id: 'session-1',
            sessionType: 'Wedding',
            venue: 'Lawn',
            venueCost: 5000,
            startDate: '2026-06-15',
            endDate: '2026-06-15',
            startTime: null,
            endTime: null,
            pax: 200,
            sessionStatus: 'Active',
            durationDays: 1,
            isMultiDay: false,
            setup: makeSessionSetup(),
            items: [
              {
                id: 'item-1',
                type: 'Meal',
                mealName: 'Lunch',
                pax: 10,
                costPerPlate: 200,
                menuItems: [],
                eventName: null,
                venue: null,
                startTime: null,
                endTime: null,
                totalCost: 2000,
              },
            ],
          },
        ],
      }),
    });
    renderPage();

    // venueTotal 5000, foodSubtotal 2000, foodTotalInclGst 2000 × 1.18 =
    // 2360, accommodationTotal 11800, extrasTotal 3000, grandTotal =
    // 5000 + 2360 + 11800 + 3000 = 22160.
    expect(await screen.findByText('Venue total: 5,000')).toBeInTheDocument();
    expect(screen.getByText('Food subtotal: 2,000')).toBeInTheDocument();
    expect(screen.getByText('Food total (incl. GST): 2,360')).toBeInTheDocument();
    expect(screen.getByText('Accommodation total: 11,800')).toBeInTheDocument();
    expect(screen.getByText('Extras total: 3,000')).toBeInTheDocument();
    const grandTotal = screen.getByText('22,160');
    expect(grandTotal).toBeInTheDocument();
    // display variant (Fraunces) — the Grand Total is the single most
    // visually prominent number on the panel (this story's own AC).
    expect(grandTotal).toHaveClass('MuiTypography-display');
  });

  it('lets an Event Manager edit extras and persist via PATCH, refreshing the Grand Total from a fresh quotation-summary call', async () => {
    seedSession();
    const { extrasPatchRequests } = mockEventDetailApi({ event: makeEvent() });
    renderPage();

    expect(await screen.findByText('Venue total: 0')).toBeInTheDocument();

    fireEvent.change(await screen.findByLabelText('Decoration'), { target: { value: '15000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save extras' }));

    await waitFor(() => expect(extrasPatchRequests).toHaveLength(1));
    expect(extrasPatchRequests[0]).toMatchObject({ decoration: 15000, photographer: 0, bhatji: 0 });
    // Grand Total (all-zero Event otherwise) becomes exactly the new
    // decoration amount, and it comes from a fresh GET (the mock
    // recomputes the whole summary from the now-updated Event), not a
    // client-side recalculation off the PATCH response alone.
    expect(await screen.findByText('Grand Total')).toBeInTheDocument();
    expect(await screen.findByText('15,000')).toBeInTheDocument();
  });

  it('shows Decoration/Photographer/Bhatji as read-only text, not inputs, for a non-EventManager session', async () => {
    seedSession('Reception');
    mockEventDetailApi({
      event: makeEvent({ extras: makeExtras({ decoration: 1000, photographer: 1500, bhatji: 500 }) }),
    });
    renderPage();

    expect(await screen.findByText('Decoration: 1,000')).toBeInTheDocument();
    expect(screen.getByText('Photographer: 1,500')).toBeInTheDocument();
    expect(screen.getByText('Bhatji: 500')).toBeInTheDocument();
    expect(screen.queryByLabelText('Decoration')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save extras' })).not.toBeInTheDocument();
  });

  it('shows an error message, not a stuck spinner, when the quotation-summary call fails', async () => {
    seedSession();
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/quotation-summary')) {
          return jsonResponse(500, { error: { code: 'INTERNAL_ERROR', message: 'Something broke.' } });
        }
        return jsonResponse(200, makeEvent());
      }),
    );
    renderPage();

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Loading Total Cost Summary')).not.toBeInTheDocument();
  });

  it('renders a Grand Total large enough to need thousands-grouping correctly, not as a raw digit string', async () => {
    seedSession();
    mockEventDetailApi({
      event: makeEvent({ extras: makeExtras({ decoration: 1234567 }) }),
    });
    renderPage();

    expect(await screen.findByText('12,34,567')).toBeInTheDocument();
  });

  it('shows "Generate Quotation PDF" only for an Event Manager session', async () => {
    seedSession('Reception');
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    await screen.findByText('ARD-EVT-2026-001');
    expect(screen.queryByRole('button', { name: 'Generate Quotation PDF' })).not.toBeInTheDocument();
  });

  it('shows a "Preview Quotation" link to the Quotation Preview screen only for an Event Manager session', async () => {
    seedSession();
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    const link = await screen.findByRole('link', { name: 'Preview Quotation' });
    expect(link).toHaveAttribute('href', '/events/event-1/quotation-preview');
  });

  it('hides the "Preview Quotation" link for a non-EventManager session', async () => {
    seedSession('Reception');
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    await screen.findByText('ARD-EVT-2026-001');
    expect(screen.queryByRole('link', { name: 'Preview Quotation' })).not.toBeInTheDocument();
  });

  it('downloads the PDF via a click-triggered object URL, without a full page navigation', async () => {
    seedSession();
    mockEventDetailApi({ event: makeEvent() });
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderPage();

    const button = await screen.findByRole('button', { name: 'Generate Quotation PDF' });
    fireEvent.click(button);

    await waitFor(() => expect(anchorClick).toHaveBeenCalledTimes(1));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    // Not toBeInstanceOf(Blob) — jsdom/vitest can construct Blob from a
    // different realm than the global this test file sees, so instanceof
    // isn't reliable here; the content-type is the meaningful check anyway.
    expect(createObjectURL.mock.calls[0]?.[0]).toMatchObject({ type: 'application/pdf' });
    // Re-enabled after completion (this story's own AC) — not left disabled.
    expect(button).toBeEnabled();

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    anchorClick.mockRestore();
  });

  it('shows a loading state while the request is in flight, re-enabling on completion', async () => {
    seedSession();
    // A manually-resolved Promise, not mockEventDetailApi's normal
    // already-resolved mock — that resolves fast enough that the whole
    // click-to-completion cycle collapses into one render, with no
    // observable gap in which the button is actually disabled.
    let resolveFetch: (response: Response) => void = () => {};
    const pendingPdfResponse = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/quotation.pdf')) {
          return pendingPdfResponse;
        }
        return jsonResponse(200, makeEvent());
      }),
    );
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderPage();

    const button = await screen.findByRole('button', { name: 'Generate Quotation PDF' });
    fireEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());

    resolveFetch(await pdfResponse(200));

    await waitFor(() => expect(button).toBeEnabled());

    vi.restoreAllMocks();
  });

  it('does not fire a second request when double-tapped while a generation is already in flight', async () => {
    seedSession();
    const { getPdfRequestCount } = mockEventDetailApi({ event: makeEvent() });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderPage();

    const button = await screen.findByRole('button', { name: 'Generate Quotation PDF' });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(button).toBeEnabled());
    expect(getPdfRequestCount()).toBe(1);

    vi.restoreAllMocks();
  });

  it('shows an inline error, not a silent failure, when generation fails', async () => {
    seedSession();
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/quotation.pdf')) {
          return pdfResponse(500);
        }
        return jsonResponse(200, makeEvent());
      }),
    );
    renderPage();

    const button = await screen.findByRole('button', { name: 'Generate Quotation PDF' });
    fireEvent.click(button);

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(button).toBeEnabled();
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

  it('does not render the Documents tab in the DOM at all for a non-EventManager session', async () => {
    seedSession('Reception');
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    await screen.findByText('ARD-EVT-2026-001');
    expect(screen.queryByRole('tab', { name: 'Documents' })).not.toBeInTheDocument();
    expect(screen.queryByText('Aadhar Card')).not.toBeInTheDocument();
  });

  it('renders exactly the six fixed Document Checklist items, in a stable order, with no add-item control', async () => {
    seedSession();
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Documents' }));

    const labels = ['Aadhar Card', 'PAN Card', 'Leaving/Birth Certificate', 'Ration Card', 'Passport Photos', 'Wedding Card'];
    for (const label of labels) {
      expect(await screen.findByText(label)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('switch')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: /add item/i })).not.toBeInTheDocument();
  });

  it('toggling a Document Checklist item persists immediately and survives a reload', async () => {
    seedSession();
    const { documentsChecklistPatchRequests } = mockEventDetailApi({ event: makeEvent() });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Documents' }));
    fireEvent.click(await screen.findByLabelText('Aadhar Card'));

    await waitFor(() => expect(documentsChecklistPatchRequests).toHaveLength(1));
    expect(documentsChecklistPatchRequests[0]).toEqual({ aadharCard: true });
    expect(screen.getByLabelText('Aadhar Card')).toBeChecked();

    // Simulate a reload: re-render against whatever the mock server now
    // holds as current state, exactly like a fresh GET /events/:id would.
    fireEvent.click(await screen.findByRole('tab', { name: 'Overview' }));
    fireEvent.click(await screen.findByRole('tab', { name: 'Documents' }));
    expect(await screen.findByLabelText('Aadhar Card')).toBeChecked();
  });

  it('renders the Sessions tab for a non-EventManager session too, unlike Payments/Documents', async () => {
    seedSession('Reception');
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    await screen.findByText('ARD-EVT-2026-001');
    expect(screen.getByRole('tab', { name: 'Sessions' })).toBeInTheDocument();
  });

  it('shows Sessions read-only, with no Add/Edit controls, for a non-EventManager session', async () => {
    seedSession('Reception');
    mockEventDetailApi({
      event: makeEvent({
        sessions: [
          {
            id: 'session-1',
            sessionType: 'Wedding',
            venue: 'Lawn',
            venueCost: 50000,
            startDate: '2026-06-15T00:00:00.000Z',
            endDate: '2026-06-15T00:00:00.000Z',
            startTime: null,
            endTime: null,
            pax: 200,
            sessionStatus: 'Active',
            durationDays: 1,
            isMultiDay: false,
            setup: makeSessionSetup(),
            items: [],
          },
        ],
      }),
    });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }));

    expect(await screen.findByText('Wedding — Lawn')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Session' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('renders the Session form with two explicit date fields and the full setup section', async () => {
    seedSession();
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Session' }));

    expect(await screen.findByLabelText('Start date')).toBeInTheDocument();
    expect(screen.getByLabelText('End date')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Seating' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tables')).toBeInTheDocument();
    expect(screen.getByLabelText('Chairs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stage' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buffet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registration desk' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'VIP seating' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bride/Groom seating' })).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('auto-fills venue_cost from the lookup table on venue selection, remaining editable afterward', async () => {
    seedSession();
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Session' }));

    const venueSelect = await screen.findByRole('combobox', { name: 'Venue' });
    fireEvent.mouseDown(venueSelect);
    fireEvent.click(screen.getByRole('option', { name: 'Full Banquet' }));

    const venueCostField = screen.getByLabelText('Venue cost');
    expect(venueCostField).toHaveValue(100000);

    fireEvent.change(venueCostField, { target: { value: '95000' } });
    expect(venueCostField).toHaveValue(95000);
  });

  it('adds a Session via POST and shows it in the list afterward', async () => {
    seedSession();
    mockEventDetailApi({ event: makeEvent() });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Session' }));

    fireEvent.change(await screen.findByLabelText('Start date'), { target: { value: '2026-06-15' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-06-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add session' }));

    expect(await screen.findByText('Engagement — Poolside')).toBeInTheDocument();
  });

  it('persists a boolean toggled off after being turned on, not omitted', async () => {
    seedSession();
    const { sessionPostRequests } = mockEventDetailApi({ event: makeEvent() });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Session' }));

    fireEvent.change(await screen.findByLabelText('Start date'), { target: { value: '2026-06-15' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-06-15' } });

    const stageToggle = screen.getByRole('button', { name: 'Stage' });
    fireEvent.click(stageToggle); // on
    fireEvent.click(stageToggle); // off again

    fireEvent.click(screen.getByRole('button', { name: 'Add session' }));

    await waitFor(() => expect(sessionPostRequests).toHaveLength(1));
    expect(sessionPostRequests[0]?.setup).toMatchObject({ stage: false });
  });

  it('blocks submit client-side when end date is before start date, without calling the server', async () => {
    seedSession();
    const { sessionPostRequests } = mockEventDetailApi({ event: makeEvent() });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Session' }));

    fireEvent.change(await screen.findByLabelText('Start date'), { target: { value: '2026-06-15' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-06-14' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add session' }));

    expect(await screen.findByText('End date must be on or after start date.')).toBeInTheDocument();
    expect(sessionPostRequests).toHaveLength(0);
    // Inline on the date field, not a generic banner.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls PATCH (STORY-028), not POST, for the edit entry point on an existing Session', async () => {
    seedSession();
    const existingSession = {
      id: 'session-1',
      sessionType: 'Wedding',
      venue: 'Lawn',
      venueCost: 50000,
      startDate: '2026-06-15T00:00:00.000Z',
      endDate: '2026-06-15T00:00:00.000Z',
      startTime: null,
      endTime: null,
      pax: 200,
      sessionStatus: 'Active',
      durationDays: 1,
      isMultiDay: false,
      setup: makeSessionSetup(),
      items: [],
    };
    const { sessionPatchRequests, sessionPostRequests } = mockEventDetailApi({
      event: makeEvent({ sessions: [existingSession] }),
    });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));

    expect(await screen.findByDisplayValue('200')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Pax'), { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save session' }));

    await waitFor(() => expect(sessionPatchRequests).toHaveLength(1));
    expect(sessionPostRequests).toHaveLength(0);
    expect(sessionPatchRequests[0]).toMatchObject({ pax: 250 });
  });

  const makeSessionWithItems = (itemOverrides: (Partial<MockItem> & { id: string })[] = []): MockSession => ({
    id: 'session-1',
    sessionType: 'Wedding',
    venue: 'Lawn',
    venueCost: 50000,
    startDate: '2026-06-15T00:00:00.000Z',
    endDate: '2026-06-15T00:00:00.000Z',
    startTime: null,
    endTime: null,
    pax: 200,
    sessionStatus: 'Active',
    durationDays: 1,
    isMultiDay: false,
    setup: makeSessionSetup(),
    items: itemOverrides.map((overrides) => makeMealItem(overrides)),
  });

  it('shows the Items section, listing already-attached Items, when editing an existing Session', async () => {
    seedSession();
    const session = makeSessionWithItems([{ id: 'item-1', mealName: 'Lunch' }]);
    mockEventDetailApi({ event: makeEvent({ sessions: [session] }) });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));

    expect(await screen.findByText('Items')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Lunch')).toBeInTheDocument();
  });

  it('adds a Meal Item via POST, reflecting the server-computed total_cost', async () => {
    seedSession();
    const session = makeSessionWithItems();
    const { itemPostRequests } = mockEventDetailApi({ event: makeEvent({ sessions: [session] }) });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Item' }));

    fireEvent.change(screen.getByLabelText('Meal name for item 1'), { target: { value: 'Dinner' } });
    fireEvent.change(screen.getByLabelText('Pax for item 1'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Cost per plate for item 1'), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));

    await waitFor(() => expect(itemPostRequests).toHaveLength(1));
    expect(itemPostRequests[0]).toMatchObject({ type: 'Meal', mealName: 'Dinner', pax: 100, costPerPlate: 500 });
    expect(await screen.findByText('Total cost: 50000')).toBeInTheDocument();
  });

  it("never shows a client-computed total_cost before save — an unsaved card reads '—'", async () => {
    seedSession();
    const session = makeSessionWithItems();
    mockEventDetailApi({ event: makeEvent({ sessions: [session] }) });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Item' }));

    fireEvent.change(screen.getByLabelText('Pax for item 1'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Cost per plate for item 1'), { target: { value: '500' } });

    expect(screen.getByText('Total cost: —')).toBeInTheDocument();
    expect(screen.queryByText('Total cost: 50000')).not.toBeInTheDocument();
  });

  it('attaches an existing Menu Item selected from search, referencing it by id on save', async () => {
    seedSession();
    const session = makeSessionWithItems();
    const { itemPostRequests } = mockEventDetailApi({
      event: makeEvent({ sessions: [session] }),
      menuItems: [makeMenuItem({ id: 'menu-item-1', name: 'Paneer Tikka' })],
    });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Item' }));

    const searchInput = await screen.findByRole('combobox', { name: 'Menu items' });
    // MUI's Autocomplete resets its typed inputValue back to '' on the next
    // render if the field isn't focused yet (its multiple-mode "no selected
    // label to show" reset effect) — a real user always focuses the field by
    // clicking into it before typing, so this mirrors that.
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'Paneer' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Paneer Tikka' }));

    fireEvent.change(screen.getByLabelText('Meal name for item 1'), { target: { value: 'Dinner' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));

    await waitFor(() => expect(itemPostRequests).toHaveLength(1));
    expect(itemPostRequests[0]?.menuItems).toEqual([{ id: 'menu-item-1' }]);
  });

  it("offers \"Add '<name>' as a new menu item\" for a not-found search, attaching it by name", async () => {
    seedSession();
    const session = makeSessionWithItems();
    const { itemPostRequests } = mockEventDetailApi({ event: makeEvent({ sessions: [session] }), menuItems: [] });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Item' }));

    const searchInput = await screen.findByRole('combobox', { name: 'Menu items' });
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'Gulab Jamun' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Add "Gulab Jamun" as a new menu item' }));

    fireEvent.change(screen.getByLabelText('Meal name for item 1'), { target: { value: 'Dessert' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));

    await waitFor(() => expect(itemPostRequests).toHaveLength(1));
    expect(itemPostRequests[0]?.menuItems).toEqual([{ name: 'Gulab Jamun' }]);
  });

  it('does not add the same Menu Item twice to one Meal Item (de-duped, this story edge case)', async () => {
    seedSession();
    const session = makeSessionWithItems();
    mockEventDetailApi({
      event: makeEvent({ sessions: [session] }),
      menuItems: [makeMenuItem({ id: 'menu-item-1', name: 'Paneer Tikka' })],
    });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Item' }));

    const searchInput = await screen.findByRole('combobox', { name: 'Menu items' });
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'Paneer' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Paneer Tikka' }));
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'Paneer' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Add "Paneer" as a new menu item' }));

    expect(screen.getAllByText('Paneer Tikka')).toHaveLength(1);
  });

  it("removes an existing Item via a real DELETE — it's gone from the Event, not just hidden locally", async () => {
    seedSession();
    const session = makeSessionWithItems([{ id: 'item-1', mealName: 'Lunch' }]);
    const { getCurrentEvent } = mockEventDetailApi({ event: makeEvent({ sessions: [session] }) });
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));

    expect(await screen.findByDisplayValue('Lunch')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(getCurrentEvent()?.sessions[0]?.items).toHaveLength(0));
    await waitFor(() => expect(screen.queryByDisplayValue('Lunch')).not.toBeInTheDocument());
  });
});
