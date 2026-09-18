import { useRef } from 'react';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import EventWizardShell from '../../src/pages/event-creation/event-wizard-shell';
import ReviewStep from '../../src/pages/event-creation/review-step';
import WizardStepPlaceholder from '../../src/pages/event-creation/wizard-step-placeholder';
import { WIZARD_STEPS } from '../../src/pages/event-creation/wizard-steps';
import { QUOTATION_PREVIEW_PATH_PATTERN } from '../../src/routes';
import { AuthProvider, SESSION_STORAGE_KEY } from '../../src/stores/auth-context';
import { WIZARD_STORAGE_KEY } from '../../src/stores/event-wizard-context';
import { theme } from '../../src/theme/theme';
import { mockMatchMedia } from '../support/match-media';

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

let lastCreateEventBody: Record<string, unknown> | undefined;

const mockCreateEventApi = (responseStatus: number) => {
  lastCreateEventBody = undefined;
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/events') && init?.method === 'POST') {
        lastCreateEventBody = JSON.parse(String(init.body));
        if (responseStatus !== 201) {
          return jsonResponse(responseStatus, { error: { code: 'SERVER_ERROR', message: 'boom' } });
        }
        return jsonResponse(201, {
          id: 'evt-1',
          eventId: 'ARD-EVT-2026-001',
          eventFamilyType: (lastCreateEventBody as { eventFamilyType: string }).eventFamilyType,
          status: 'Tentative',
          eventManager: 'manager-1',
          clientContacts: [],
          accommodation: { checkIn: null, checkOut: null, totalDays: null, roomLines: [], totalOccupancy: 0, totalCharges: 0 },
          payment: { totalEstimatedAmount: 0, advanceRequired: 0, advancePaid: 0, advancePaidDate: null, paymentMode: null, balance: 0 },
          documentsChecklist: {
            aadharCard: false,
            panCard: false,
            leavingBirthCertificate: false,
            rationCard: false,
            passportPhotos: false,
            weddingCard: false,
          },
          extras: { decoration: 0, photographer: 0, bhatji: 0 },
          extraLineItems: [],
          sessions: [],
          createdBy: 'manager-1',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        });
      }
      throw new Error(`Unhandled request: ${url}`);
    }),
  );
};

// Mirrors app.tsx's own ref-forwarding wiring (STORY-068) — the shared
// wizard footer's "Generate Quotation" button lives one layer above
// ReviewStep's own EventWizardProvider, so this test wrapper reproduces
// exactly how the real route calls through to ReviewStep's own submit
// closure, rather than testing ReviewStep in a way the real app never
// actually renders it.
const ReviewStepRoute = () => {
  const submitRef = useRef<() => void>(() => {});
  return (
    <EventWizardShell step="review" onNext={() => submitRef.current()}>
      <ReviewStep registerSubmit={(submit) => (submitRef.current = submit)} />
    </EventWizardShell>
  );
};

const renderWizard = (initialPath: string) => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <MemoryRouter initialEntries={[initialPath]}>
              <Routes>
                {WIZARD_STEPS.filter((step) => step.id !== 'review').map((step) => (
                  <Route
                    key={step.id}
                    path={step.path}
                    element={
                      <EventWizardShell step={step.id}>
                        <WizardStepPlaceholder step={step.id} />
                      </EventWizardShell>
                    }
                  />
                ))}
                <Route path={WIZARD_STEPS[4]!.path} element={<ReviewStepRoute />} />
                <Route path={QUOTATION_PREVIEW_PATH_PATTERN} element={<div>Quotation preview for evt-1</div>} />
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>,
  );
};

const reviewPath = WIZARD_STEPS[4]!.path;

const seedSession = () => {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ token: 'signed-jwt', user: { id: 'manager-1', name: 'Priya Nair', role: 'EventManager' } }),
  );
};

const BASE_WIZARD_DATA = {
  'client-details': {
    contacts: [
      { id: 'bride', roleLabel: 'Bride', isDefault: true, name: 'Sneha Vaidya', contactNumber: '9876543210' },
      { id: 'groom', roleLabel: 'Groom', isDefault: true, name: '', contactNumber: '' },
      { id: 'poc', roleLabel: 'Point of Contact', isDefault: true, name: '', contactNumber: '' },
    ],
  },
  'event-details': {
    sessions: [
      {
        id: 's1',
        sessionType: 'Wedding',
        venue: 'Poolside',
        venueCost: 60000,
        pax: 200,
        startDate: '2026-09-12',
        endDate: '2026-09-13',
        startTime: '',
        endTime: '',
      },
    ],
  },
  accommodation: {
    checkInDate: '2026-09-12',
    checkInTime: '',
    checkOutDate: '2026-09-13',
    checkOutTime: '',
    roomLines: [{ id: 'r1', roomType: 'Deluxe', occupancy: 2, tariff: 2500, noOfRooms: 2, locked: false }],
  },
  'sessions-items': {
    byDate: {
      '2026-09-12': [
        {
          id: 'f1',
          type: 'Meal',
          mealName: 'Lunch',
          startTime: '',
          endTime: '',
          pax: 50,
          limitedSeating: false,
          costPerPlate: 300,
          menuItems: [],
        },
      ],
    },
    visitedDates: ['2026-09-12', '2026-09-13'],
    allDatesVisited: true,
  },
};

const seedWizardData = (overrides: Record<string, unknown> = {}) => {
  sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ ...BASE_WIZARD_DATA, ...overrides }));
};

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  mockMatchMedia(true);
  seedSession();
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
  localStorage.clear();
});

describe('ReviewStep', () => {
  it('renders the Total Cost Summary computed from every prior step’s own wizard data', async () => {
    seedWizardData();
    renderWizard(reviewPath);

    expect(await screen.findByText('12/09/2026')).toBeInTheDocument();
    expect(screen.getByText('Poolside')).toBeInTheDocument();
    expect(screen.getByText('60,000')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    // Food Cost: 50 pax × 300 = 15,000 (the Lunch row's own Total Cost and
    // the Food Cost aggregate row happen to read the same figure here,
    // since there's only one food row); with 5% GST (default) = 15,750.
    expect(screen.getAllByText('15,000')).toHaveLength(2);
    expect(screen.getByText('15,750')).toBeInTheDocument();
    // Accommodation: 2500 × 2 rooms × 1 night × 1.05 = 5,250 — check-in
    // 2026-09-12 to check-out 2026-09-13 is 1 calendar day apart (STORY-070:
    // nights stayed, not an inclusive calendar-day count).
    expect(screen.getByText('5,250')).toBeInTheDocument();
    // Grand Total: 60,000 + 15,750 + 5,250 = 81,000.
    expect(screen.getByText('81,000')).toBeInTheDocument();
  });

  it('recomputes Food Cost with GST and the Grand Total live when the GST % field changes', async () => {
    seedWizardData();
    renderWizard(reviewPath);
    await screen.findByText('Poolside');

    fireEvent.change(screen.getByLabelText('GST %'), { target: { value: '18' } });

    // 15,000 × 1.18 = 17,700; Grand Total = 60,000 + 17,700 + 5,250 = 82,950.
    await waitFor(() => expect(screen.getByText('17,700')).toBeInTheDocument());
    expect(screen.getByText('82,950')).toBeInTheDocument();
  });

  it('adds a manual line item with a note, included in the Grand Total, and can remove it again', async () => {
    seedWizardData();
    renderWizard(reviewPath);
    await screen.findByText('Poolside');

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Decoration' } });
    fireEvent.change(screen.getByLabelText('Note (optional)'), { target: { value: 'poolside decor' } });
    fireEvent.change(screen.getByLabelText('Total Cost with GST'), { target: { value: '5000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Line Item' }));

    await waitFor(() => expect(screen.getByText('Decoration')).toBeInTheDocument());
    expect(screen.getByText('poolside decor')).toBeInTheDocument();
    // Grand Total: 81,000 + 5,000 = 86,000.
    expect(screen.getByText('86,000')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Decoration line item' }));

    await waitFor(() => expect(screen.queryByText('Decoration')).not.toBeInTheDocument());
    expect(screen.getByText('81,000')).toBeInTheDocument();
  });

  it('defaults Event Type from the last Session’s own sessionType', async () => {
    seedWizardData();
    renderWizard(reviewPath);
    await screen.findByText('Poolside');

    expect(screen.getByText('Wedding', { selector: 'div' })).toBeInTheDocument();
  });

  it('submits the whole wizard as one POST /events call, clears the wizard, and navigates to Quotation Preview', async () => {
    mockCreateEventApi(201);
    seedWizardData();
    renderWizard(reviewPath);
    await screen.findByText('Poolside');

    fireEvent.click(screen.getByRole('button', { name: 'Generate Quotation' }));

    expect(await screen.findByText('Quotation preview for evt-1')).toBeInTheDocument();
    expect(sessionStorage.getItem(WIZARD_STORAGE_KEY)).toBeNull();

    expect(lastCreateEventBody).toMatchObject({
      eventFamilyType: 'Wedding',
      eventManager: 'manager-1',
      clientContacts: [{ name: 'Sneha Vaidya', contactNumber: '9876543210', role: 'Bride' }],
    });
    const body = lastCreateEventBody as { sessions: { items: unknown[] }[]; accommodation: { roomLines: unknown[] } };
    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0]!.items).toHaveLength(1);
    expect(body.accommodation.roomLines).toHaveLength(1);
  });

  it('keeps the wizard data intact and shows an error when submission fails', async () => {
    mockCreateEventApi(500);
    seedWizardData();
    renderWizard(reviewPath);
    await screen.findByText('Poolside');

    fireEvent.click(screen.getByRole('button', { name: 'Generate Quotation' }));

    expect(await screen.findByText('Something went wrong creating the Event. Please try again.')).toBeInTheDocument();
    expect(sessionStorage.getItem(WIZARD_STORAGE_KEY)).not.toBeNull();
    expect(screen.getByText('Poolside')).toBeInTheDocument();
  });

  it('blocks submission with a message when no Client Contact has a name, without calling the API', async () => {
    mockCreateEventApi(201);
    seedWizardData({ 'client-details': { contacts: [{ id: 'bride', roleLabel: 'Bride', isDefault: true, name: '', contactNumber: '' }] } });
    renderWizard(reviewPath);
    await screen.findByText('Poolside');

    fireEvent.click(screen.getByRole('button', { name: 'Generate Quotation' }));

    expect(
      await screen.findByText(
        'Add at least one Client Contact with both a name and a contact number in Step 1 before generating the quotation.',
      ),
    ).toBeInTheDocument();
    expect(lastCreateEventBody).toBeUndefined();
  });

  it('blocks submission when a Client Contact has a name but no contact number', async () => {
    mockCreateEventApi(201);
    seedWizardData({
      'client-details': {
        contacts: [{ id: 'bride', roleLabel: 'Bride', isDefault: true, name: 'Sneha Vaidya', contactNumber: '' }],
      },
    });
    renderWizard(reviewPath);
    await screen.findByText('Poolside');

    fireEvent.click(screen.getByRole('button', { name: 'Generate Quotation' }));

    expect(
      await screen.findByText(
        'Add at least one Client Contact with both a name and a contact number in Step 1 before generating the quotation.',
      ),
    ).toBeInTheDocument();
    expect(lastCreateEventBody).toBeUndefined();
  });

  it('ignores a second click fired before the first submission settles, sending only one request', async () => {
    let resolveFirstCall: (() => void) | undefined;
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/events') && init?.method === 'POST') {
          callCount += 1;
          return new Promise((resolve) => {
            resolveFirstCall = () =>
              resolve(
                new Response(JSON.stringify({ id: 'evt-1' }), { status: 201, headers: { 'content-type': 'application/json' } }),
              );
          });
        }
        throw new Error(`Unhandled request: ${url}`);
      }),
    );
    seedWizardData();
    renderWizard(reviewPath);
    await screen.findByText('Poolside');

    const generateButton = screen.getByRole('button', { name: 'Generate Quotation' });
    fireEvent.click(generateButton);
    fireEvent.click(generateButton);
    fireEvent.click(generateButton);

    // mutate() dispatches the actual fetch asynchronously — waits for it
    // to have been issued at least once before asserting it was issued
    // exactly once, not zero times because nothing settled yet.
    await waitFor(() => expect(callCount).toBeGreaterThan(0));
    expect(callCount).toBe(1);
    resolveFirstCall?.();
  });

  it('falls back Accommodation’s own total_days to 1 (not a negative number) for a stale invalid check-in/check-out range', async () => {
    seedWizardData({
      accommodation: {
        checkInDate: '2026-09-13',
        checkInTime: '',
        checkOutDate: '2026-09-12',
        checkOutTime: '',
        roomLines: [{ id: 'r1', roomType: 'Deluxe', occupancy: 2, tariff: 2500, noOfRooms: 2, locked: false }],
      },
    });
    renderWizard(reviewPath);
    await screen.findByText('Poolside');

    // 2500 × 2 rooms × 1 day (fallback, not -1) × 1.05 = 5,250 — never a
    // negative Accommodation total.
    expect(await screen.findByText('5,250')).toBeInTheDocument();
  });

  it('recomputes to include a newly-added Food/Dining Event without losing or duplicating manual line items (edge case)', async () => {
    seedWizardData();
    renderWizard(reviewPath);
    await screen.findByText('Poolside');

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Decoration' } });
    fireEvent.change(screen.getByLabelText('Total Cost with GST'), { target: { value: '5000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Line Item' }));
    await screen.findByText('Decoration');

    // Simulate "Back to Step 4, add another Food/Dining Event, return to
    // Step 5" by re-seeding sessions-items with an extra food row and
    // remounting — the manual line item (already in the wizard store)
    // must survive, and the new food row must appear exactly once.
    const stored = JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) ?? '{}');
    stored['sessions-items'].byDate['2026-09-12'].push({
      id: 'f2',
      type: 'Meal',
      mealName: 'Hi-Tea',
      startTime: '',
      endTime: '',
      pax: 50,
      limitedSeating: false,
      costPerPlate: 100,
      menuItems: [],
    });
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(stored));

    // Unmounts the first render before mounting a fresh one — render()
    // doesn't auto-cleanup between calls within a single test the way it
    // does between separate it() blocks (afterEach), so without this both
    // trees would sit in the DOM at once.
    cleanup();
    renderWizard(reviewPath);

    await screen.findByText('Hi-Tea');
    expect(screen.getAllByText('Decoration')).toHaveLength(1);
    expect(screen.getAllByText('Lunch')).toHaveLength(1);
    // Food Cost: (50×300) + (50×100) = 20,000; ×1.05 = 21,000.
    expect(screen.getByText('20,000')).toBeInTheDocument();
    expect(screen.getByText('21,000')).toBeInTheDocument();
    // Grand Total: 60,000 + 21,000 + 5,250 + 5,000 (manual) = 91,250.
    expect(screen.getByText('91,250')).toBeInTheDocument();
  });
});
