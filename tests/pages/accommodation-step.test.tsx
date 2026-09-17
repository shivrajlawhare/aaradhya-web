import { ThemeProvider } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import AccommodationStep from '../../src/pages/event-creation/accommodation-step';
import EventWizardShell from '../../src/pages/event-creation/event-wizard-shell';
import WizardStepPlaceholder from '../../src/pages/event-creation/wizard-step-placeholder';
import { WIZARD_STEPS } from '../../src/pages/event-creation/wizard-steps';
import { WIZARD_STORAGE_KEY } from '../../src/stores/event-wizard-context';
import { theme } from '../../src/theme/theme';
import { mockMatchMedia } from '../support/match-media';

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

const ROOM_TYPES = [
  { id: 'rt-1', name: 'Deluxe', defaultTariff: 4000, active: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'rt-2', name: 'Executive', defaultTariff: 6000, active: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'rt-3', name: 'Dormitory', defaultTariff: 1500, active: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'rt-4', name: 'Extra Beds', defaultTariff: 800, active: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'rt-5', name: 'Retired Type', defaultTariff: 2000, active: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
];

const mockRoomTypesApi = () => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/room-types')) {
        return jsonResponse(200, ROOM_TYPES);
      }
      throw new Error(`Unhandled request: ${url}`);
    }),
  );
};

const renderWizard = (initialPath: string) => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <MemoryRouter initialEntries={[initialPath]}>
              <Routes>
                {WIZARD_STEPS.filter((step) => step.id !== 'accommodation').map((step) => (
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
                <Route
                  path={WIZARD_STEPS[2]!.path}
                  element={
                    <EventWizardShell step="accommodation">
                      <AccommodationStep />
                    </EventWizardShell>
                  }
                />
              </Routes>
            </MemoryRouter>
          </LocalizationProvider>
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>,
  );
};

const accommodationPath = WIZARD_STEPS[2]!.path;

// Same sectioned-spinbutton fill pattern event-details-step.test.tsx's own
// fillDatePicker already established for this exact DatePicker component.
const fillDatePicker = async (user: ReturnType<typeof userEvent.setup>, labelText: string, mmddyyyy: string) => {
  const group = screen.getByRole('group', { name: labelText });
  const sections = within(group).getAllByRole('spinbutton');
  const firstSection = sections[0];
  if (!firstSection) {
    throw new Error(`expected ${labelText} to have at least one date section`);
  }
  await user.click(firstSection);
  await user.keyboard(mmddyyyy);
};

beforeEach(() => {
  sessionStorage.clear();
  mockMatchMedia(true);
  mockRoomTypesApi();
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('AccommodationStep', () => {
  it('seeds one Room Line per active Room Type, tariff auto-filled, and Extra Beds has no remove button', async () => {
    renderWizard(accommodationPath);
    // A longer wait than the other tests here (the first test in this file
    // to render the wizard shell + 4 seeded dropdown rows) — under a full
    // parallel test-suite run this consistently lands nearer the default
    // 5000ms findBy timeout than any other assertion in this file, purely
    // from worker-pool CPU contention, not real async slowness (isolated
    // runs settle in ~1s).
    await screen.findByText('Deluxe', {}, { timeout: 10000 });

    expect(screen.getByText('Executive')).toBeInTheDocument();
    expect(screen.getByText('Dormitory')).toBeInTheDocument();
    expect(screen.getByText('Extra Beds')).toBeInTheDocument();
    expect(screen.queryByText('Retired Type')).not.toBeInTheDocument();

    expect(screen.getByLabelText('Tariff for room line 1')).toHaveValue(4000);
    expect(screen.getByLabelText('Tariff for room line 4')).toHaveValue(800);

    expect(screen.queryByRole('button', { name: 'Remove Extra Beds line' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Deluxe line' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Executive line' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Dormitory line' })).toBeInTheDocument();
  });

  it('removing a non-Extra-Beds row removes just that row', async () => {
    renderWizard(accommodationPath);
    await screen.findByText('Deluxe');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Deluxe line' }));

    expect(screen.queryByText('Deluxe')).not.toBeInTheDocument();
    expect(screen.getByText('Extra Beds')).toBeInTheDocument();
  });

  it('"+ Add Room Line" appends a further row with its own remove affordance', async () => {
    renderWizard(accommodationPath);
    await screen.findByText('Deluxe');

    fireEvent.click(screen.getByRole('button', { name: 'Add Room Line' }));

    expect(screen.getAllByRole('button', { name: /^Remove .* line$/ })).toHaveLength(4);
  });

  it("auto-fills a row's Tariff from the newly selected Room Type's defaultTariff, and it stays editable", async () => {
    renderWizard(accommodationPath);
    await screen.findByText('Deluxe');
    fireEvent.click(screen.getByRole('button', { name: 'Add Room Line' }));

    fireEvent.mouseDown(screen.getByLabelText('Room type for room line 5'));
    fireEvent.click(await screen.findByRole('option', { name: 'Executive' }));

    expect(screen.getByLabelText('Tariff for room line 5')).toHaveValue(6000);

    fireEvent.change(screen.getByLabelText('Tariff for room line 5'), { target: { value: '6500' } });
    expect(screen.getByLabelText('Tariff for room line 5')).toHaveValue(6500);
  });

  it('computes each row’s Total (incl. GST) live as Tariff/Rooms change, and sums the footer totals', async () => {
    renderWizard(accommodationPath);
    await screen.findByText('Deluxe');

    fireEvent.change(screen.getByLabelText('Occupancy for room line 1'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Number of rooms for room line 1'), { target: { value: '3' } });
    // tariff 4000 * 3 rooms * 1.18 = 14,160
    expect(screen.getByText('14,160')).toBeInTheDocument();

    // occupancy 2 * 3 rooms = 6
    expect(screen.getByText('Total Occupancy: 6')).toBeInTheDocument();
    expect(screen.getByText('Total Charges: 14,160')).toBeInTheDocument();
  });

  it('"Next: Sessions & Items" is disabled until Check-in and Check-out are both set', async () => {
    const user = userEvent.setup();
    renderWizard(accommodationPath);
    await screen.findByText('Deluxe');

    expect(screen.getByRole('button', { name: 'Next: Sessions & Items →' })).toBeDisabled();

    await fillDatePicker(user, 'Check-in date', '12102026');
    await fillDatePicker(user, 'Check-out date', '12122026');

    await waitFor(() => expect(screen.getByRole('button', { name: 'Next: Sessions & Items →' })).toBeEnabled());
  });

  it('Room Lines may all stay at zero and Next still enables once dates are set', async () => {
    const user = userEvent.setup();
    renderWizard(accommodationPath);
    await screen.findByText('Deluxe');
    await fillDatePicker(user, 'Check-in date', '12102026');
    await fillDatePicker(user, 'Check-out date', '12122026');

    await waitFor(() => expect(screen.getByRole('button', { name: 'Next: Sessions & Items →' })).toBeEnabled());
    expect(screen.getByLabelText('Occupancy for room line 1')).toHaveValue(0);
  });

  it('derives Total days inclusively from Check-in/Check-out, and blocks with a message when Check-out is before Check-in', async () => {
    const user = userEvent.setup();
    renderWizard(accommodationPath);
    await screen.findByText('Deluxe');

    await fillDatePicker(user, 'Check-in date', '12102026');
    await fillDatePicker(user, 'Check-out date', '12122026');
    await waitFor(() => expect(screen.getByText(/Total days: 3/)).toBeInTheDocument());

    await fillDatePicker(user, 'Check-out date', '12082026');

    expect(await screen.findByText('Check-out must be on or after check-in.')).toBeInTheDocument();
    expect(screen.getByText(/Total days: —/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next: Sessions & Items →' })).toBeDisabled());
  });

  it('recomputes Total days live when Check-in/Check-out change after Room Lines are already entered', async () => {
    const user = userEvent.setup();
    renderWizard(accommodationPath);
    await screen.findByText('Deluxe');
    fireEvent.change(screen.getByLabelText('Number of rooms for room line 1'), { target: { value: '2' } });

    await fillDatePicker(user, 'Check-in date', '12102026');
    await fillDatePicker(user, 'Check-out date', '12122026');
    await waitFor(() => expect(screen.getByText(/Total days: 3/)).toBeInTheDocument());

    await fillDatePicker(user, 'Check-out date', '12152026');

    await waitFor(() => expect(screen.getByText(/Total days: 6/)).toBeInTheDocument());
    // Room data entered before the date edit is untouched.
    expect(screen.getByLabelText('Number of rooms for room line 1')).toHaveValue(2);
  });

  it('carries entered Accommodation data forward across Back/Next between Step 3 and Step 2', async () => {
    const user = userEvent.setup();
    // Event Details' own readiness check (wizard-step-readiness.ts) requires
    // at least one Session before its own Next enables — seeded here so
    // stepping back to that placeholder and forward again isn't blocked by
    // an unrelated step's own validation.
    sessionStorage.setItem(
      WIZARD_STORAGE_KEY,
      JSON.stringify({ 'event-details': { sessions: [{ id: 's-1' }] } }),
    );
    renderWizard(accommodationPath);
    await screen.findByText('Deluxe');
    await fillDatePicker(user, 'Check-in date', '12102026');
    await fillDatePicker(user, 'Check-out date', '12122026');
    await waitFor(() => expect(screen.getByText(/Total days: 3/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect(screen.getByText('Event Details')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next: Accommodation →' }));
    await screen.findByText('Deluxe');
    expect(screen.getByText(/Total days: 3/)).toBeInTheDocument();
  });

  it('does not re-seed default Room Lines after they were already removed and stored', async () => {
    sessionStorage.setItem(
      WIZARD_STORAGE_KEY,
      JSON.stringify({
        accommodation: {
          checkInDate: '2026-12-10',
          checkInTime: '',
          checkOutDate: '2026-12-12',
          checkOutTime: '',
          roomLines: [{ id: 'room-line-1', roomType: 'Extra Beds', occupancy: 0, tariff: 800, noOfRooms: 0, locked: true }],
        },
      }),
    );
    renderWizard(accommodationPath);

    await screen.findByText('Extra Beds');
    expect(screen.queryByText('Deluxe')).not.toBeInTheDocument();
    expect(screen.queryByText('Executive')).not.toBeInTheDocument();
  });
});
