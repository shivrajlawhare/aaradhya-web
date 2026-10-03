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

const roomType = (id: string, name: string, occupancy: number, defaultTariff: number, active = true) => ({
  id,
  name,
  occupancy,
  defaultTariff,
  active,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

// The DEV-07 seed (scripts/seed-config.ts), plus one inactive type.
const ROOM_TYPES = [
  roomType('rt-1', 'Delux', 2, 2800),
  roomType('rt-2', 'Executive', 3, 3800),
  roomType('rt-3', 'Family Room', 6, 6000),
  roomType('rt-4', 'Extra Beds', 0, 700),
  roomType('rt-5', 'Retired Type', 4, 2000, false),
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
    })
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
    </QueryClientProvider>
  );
};

const accommodationPath = WIZARD_STEPS[2]!.path;

// Same sectioned-spinbutton fill pattern event-details-step.test.tsx's own
// fillDatePicker already established for this exact DatePicker component.
// Digit order is DD/MM/YYYY (theme.ts's own MuiDatePicker defaultProps).
const fillDatePicker = async (user: ReturnType<typeof userEvent.setup>, labelText: string, ddmmyyyy: string) => {
  const group = screen.getByRole('group', { name: labelText });
  const sections = within(group).getAllByRole('spinbutton');
  const firstSection = sections[0];
  if (!firstSection) {
    throw new Error(`expected ${labelText} to have at least one date section`);
  }
  await user.click(firstSection);
  await user.keyboard(ddmmyyyy);
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

// The totals block prints each stat's label and value as separate nodes.
const statValue = (label: string): string | null | undefined =>
  screen.getByText(label, { selector: 'p' }).nextElementSibling?.textContent;

const nextButton = () => screen.getByRole('button', { name: 'Next: Sessions & Items →' });

describe('AccommodationStep', () => {
  it('seeds the D8 default Room Lines — Delux 14 · Executive 2 · Family Room 2 · Extra Beds 0 — with master tariffs', async () => {
    renderWizard(accommodationPath);
    // A longer wait than the other tests here (the first test in this file
    // to render the wizard shell + 4 seeded dropdown rows) — under a full
    // parallel test-suite run this consistently lands nearer the default
    // 5000ms findBy timeout than any other assertion in this file, purely
    // from worker-pool CPU contention, not real async slowness (isolated
    // runs settle in ~1s).
    await screen.findByText('Delux', {}, { timeout: 10000 });

    expect(screen.getByText('Executive')).toBeInTheDocument();
    expect(screen.getByText('Family Room')).toBeInTheDocument();
    expect(screen.getByText('Extra Beds')).toBeInTheDocument();
    expect(screen.queryByText('Retired Type')).not.toBeInTheDocument();

    [14, 2, 2, 0].forEach((rooms, index) => {
      expect(screen.getByLabelText(`Number of rooms for room line ${index + 1}`)).toHaveValue(rooms);
    });
    expect(screen.getByLabelText('Tariff for room line 1')).toHaveValue(2800);
    expect(screen.getByLabelText('Tariff for room line 4')).toHaveValue(700);

    expect(screen.queryByRole('button', { name: 'Remove Extra Beds line' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Delux line' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Executive line' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Family Room line' })).toBeInTheDocument();
  });

  it('shows occupancy read-only from the Room Type master — no occupancy input anywhere', async () => {
    renderWizard(accommodationPath);
    await screen.findByText('Delux');

    expect(screen.queryByLabelText(/^Occupancy for room line/)).not.toBeInTheDocument();
    const firstRow = screen.getByLabelText('Room type for room line 1').closest('tr')!;
    expect(within(firstRow).getAllByRole('cell')[1]!.textContent).toBe('2');
    // 2×14 + 3×2 + 6×2 + 0 = 46 (example 3's Total Occ.).
    expect(statValue('Total Occupancy')).toBe('46');
  });

  it('removing a non-Extra-Beds row removes just that row', async () => {
    renderWizard(accommodationPath);
    await screen.findByText('Delux');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Delux line' }));

    expect(screen.queryByText('Delux')).not.toBeInTheDocument();
    expect(screen.getByText('Extra Beds')).toBeInTheDocument();
  });

  it('"+ Add Room Line" appends a further row with its own remove affordance', async () => {
    renderWizard(accommodationPath);
    await screen.findByText('Delux');

    fireEvent.click(screen.getByRole('button', { name: 'Add Room Line' }));

    expect(screen.getAllByRole('button', { name: /^Remove .* line$/ })).toHaveLength(4);
  });

  it("copies the selected Room Type's occupancy and default tariff, and the tariff stays editable", async () => {
    renderWizard(accommodationPath);
    await screen.findByText('Delux');
    fireEvent.click(screen.getByRole('button', { name: 'Add Room Line' }));

    fireEvent.mouseDown(screen.getByLabelText('Room type for room line 5'));
    fireEvent.click(await screen.findByRole('option', { name: 'Executive' }));

    expect(screen.getByLabelText('Tariff for room line 5')).toHaveValue(3800);
    const newRow = screen.getByLabelText('Room type for room line 5').closest('tr')!;
    expect(within(newRow).getAllByRole('cell')[1]!.textContent).toBe('3');

    fireEvent.change(screen.getByLabelText('Tariff for room line 5'), { target: { value: '4000' } });
    expect(screen.getByLabelText('Tariff for room line 5')).toHaveValue(4000);
  });

  it('reproduces example 3: Total Taxable Amounts, Total Charges, a 10% discount and the Final Amount', async () => {
    const user = userEvent.setup();
    renderWizard(accommodationPath);
    await screen.findByText('Delux');
    await fillDatePicker(user, 'Check-in date', '13052027');
    await fillDatePicker(user, 'Check-out date', '15052027');
    await waitFor(() => expect(screen.getByText(/Total nights: 2/)).toBeInTheDocument());

    expect(screen.getByRole('columnheader', { name: 'Total Taxable Amount' })).toBeInTheDocument();
    expect(screen.getByText('₹ 78,400')).toBeInTheDocument();
    expect(screen.getByText('₹ 15,200')).toBeInTheDocument();
    expect(screen.getByText('₹ 24,000')).toBeInTheDocument();
    // At 0% the discount rows are hidden: the tile shows Total Charges.
    expect(screen.queryByText('Final Amount')).not.toBeInTheDocument();
    expect(statValue('Total Charges')).toBe('₹ 1,17,600');

    fireEvent.change(screen.getByLabelText('Discount (%)'), { target: { value: '10' } });

    expect(screen.getByText('Discount 10%').nextElementSibling?.textContent).toBe('₹ 11,760');
    expect(screen.getByText('Total Charges').nextElementSibling?.textContent).toBe('₹ 1,17,600');
    expect(statValue('Final Amount')).toBe('₹ 1,05,840');
  });

  it('rejects a Discount (%) that is not a whole number 0–100, keeping Next disabled', async () => {
    const user = userEvent.setup();
    renderWizard(accommodationPath);
    await screen.findByText('Delux');
    await fillDatePicker(user, 'Check-in date', '10122026');
    await fillDatePicker(user, 'Check-out date', '12122026');
    await waitFor(() => expect(nextButton()).toBeEnabled());

    fireEvent.change(screen.getByLabelText('Discount (%)'), { target: { value: '150' } });

    expect(screen.getByText('Enter a whole number from 0 to 100.')).toBeInTheDocument();
    await waitFor(() => expect(nextButton()).toBeDisabled());

    fireEvent.change(screen.getByLabelText('Discount (%)'), { target: { value: '12.5' } });
    expect(screen.getByText('Enter a whole number from 0 to 100.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Discount (%)'), { target: { value: '12' } });
    expect(screen.queryByText('Enter a whole number from 0 to 100.')).not.toBeInTheDocument();
    await waitFor(() => expect(nextButton()).toBeEnabled());
  });

  it('"Next: Sessions & Items" is disabled until Check-in and Check-out are both set', async () => {
    const user = userEvent.setup();
    renderWizard(accommodationPath);
    await screen.findByText('Delux');

    expect(nextButton()).toBeDisabled();

    await fillDatePicker(user, 'Check-in date', '10122026');
    await fillDatePicker(user, 'Check-out date', '12122026');

    await waitFor(() => expect(nextButton()).toBeEnabled());
  });

  it('Room Lines may all be zeroed and Next still enables once dates are set', async () => {
    const user = userEvent.setup();
    renderWizard(accommodationPath);
    await screen.findByText('Delux');
    for (const line of [1, 2, 3]) {
      fireEvent.change(screen.getByLabelText(`Number of rooms for room line ${line}`), { target: { value: '0' } });
    }
    await fillDatePicker(user, 'Check-in date', '10122026');
    await fillDatePicker(user, 'Check-out date', '12122026');

    await waitFor(() => expect(nextButton()).toBeEnabled());
    expect(statValue('Total Occupancy')).toBe('0');
  });

  it('derives Total nights from Check-in/Check-out, and blocks with a message when Check-out is before Check-in', async () => {
    const user = userEvent.setup();
    renderWizard(accommodationPath);
    await screen.findByText('Delux');

    await fillDatePicker(user, 'Check-in date', '10122026');
    await fillDatePicker(user, 'Check-out date', '12122026');
    await waitFor(() => expect(screen.getByText(/Total nights: 2/)).toBeInTheDocument());

    await fillDatePicker(user, 'Check-out date', '08122026');

    expect(await screen.findByText('Check-out must be on or after check-in.')).toBeInTheDocument();
    expect(screen.getByText(/Total nights: —/)).toBeInTheDocument();
    await waitFor(() => expect(nextButton()).toBeDisabled());
  });

  it('recomputes Total nights live when Check-in/Check-out change after Room Lines are already entered', async () => {
    const user = userEvent.setup();
    renderWizard(accommodationPath);
    await screen.findByText('Delux');
    fireEvent.change(screen.getByLabelText('Number of rooms for room line 1'), { target: { value: '2' } });

    await fillDatePicker(user, 'Check-in date', '10122026');
    await fillDatePicker(user, 'Check-out date', '12122026');
    await waitFor(() => expect(screen.getByText(/Total nights: 2/)).toBeInTheDocument());

    await fillDatePicker(user, 'Check-out date', '15122026');

    await waitFor(() => expect(screen.getByText(/Total nights: 5/)).toBeInTheDocument());
    // Room data entered before the date edit is untouched.
    expect(screen.getByLabelText('Number of rooms for room line 1')).toHaveValue(2);
  });

  it('carries entered Accommodation data forward across Back/Next between Step 3 and Step 2', async () => {
    const user = userEvent.setup();
    // Event Details' own readiness check (wizard-step-readiness.ts) requires
    // at least one Session before its own Next enables — seeded here so
    // stepping back to that placeholder and forward again isn't blocked by
    // an unrelated step's own validation.
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ 'event-details': { sessions: [{ id: 's-1' }] } }));
    renderWizard(accommodationPath);
    await screen.findByText('Delux');
    await fillDatePicker(user, 'Check-in date', '10122026');
    await fillDatePicker(user, 'Check-out date', '12122026');
    fireEvent.change(screen.getByLabelText('Discount (%)'), { target: { value: '10' } });
    await waitFor(() => expect(screen.getByText(/Total nights: 2/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect(screen.getByText('Event Details')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next: Accommodation →' }));
    await screen.findByText('Delux');
    expect(screen.getByText(/Total nights: 2/)).toBeInTheDocument();
    expect(screen.getByLabelText('Discount (%)')).toHaveValue(10);
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
          roomLines: [
            { id: 'room-line-1', roomType: 'Extra Beds', occupancy: 0, tariff: 800, noOfRooms: 0, locked: true },
          ],
        },
      })
    );
    renderWizard(accommodationPath);

    await screen.findByText('Extra Beds');
    expect(screen.queryByText('Delux')).not.toBeInTheDocument();
    expect(screen.queryByText('Executive')).not.toBeInTheDocument();
  });

  it('renders a card per Room Line on mobile, with "Occ. N" and its Total Taxable Amount', async () => {
    mockMatchMedia(false);
    renderWizard(accommodationPath);
    await screen.findByText('Delux');

    const firstCard = screen.getByRole('group', { name: 'Room line 1' });
    expect(within(firstCard).getByText('Occ. 2')).toBeInTheDocument();
    expect(within(firstCard).getByText('Total Taxable Amount')).toBeInTheDocument();
    // No dates yet — nights fall back to 1: 2800 × 14.
    expect(within(firstCard).getByText('₹ 39,200')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('Range-limited Check-out date (DEV-19, V5)', () => {
  const dateField = (labelText: string) => {
    const field = screen.getByRole('group', { name: labelText }).closest('.MuiFormControl-root');
    if (!(field instanceof HTMLElement)) {
      throw new Error(`expected the ${labelText} field`);
    }
    return field;
  };
  const dateValue = (labelText: string) =>
    within(dateField(labelText))
      .getAllByRole('spinbutton')
      .map((section) => section.textContent)
      .join('/');

  it('opens the Check-out calendar on the Check-in month, with earlier days disabled', async () => {
    const user = userEvent.setup();
    renderWizard(accommodationPath);
    await screen.findByRole('group', { name: 'Check-in date' });
    await fillDatePicker(user, 'Check-in date', '13052027');

    await user.click(within(dateField('Check-out date')).getByRole('button', { name: /choose date/i }));
    const calendar = await screen.findByRole('dialog');

    expect(within(calendar).getByText('May 2027')).toBeInTheDocument();
    expect(within(calendar).getByRole('gridcell', { name: '12' })).toBeDisabled();
    expect(within(calendar).getByRole('gridcell', { name: '13' })).toBeEnabled();
  });

  it('clears Check-out when Check-in moves past it', async () => {
    const user = userEvent.setup();
    renderWizard(accommodationPath);
    await screen.findByRole('group', { name: 'Check-in date' });
    await fillDatePicker(user, 'Check-in date', '13052027');
    await fillDatePicker(user, 'Check-out date', '15052027');
    expect(dateValue('Check-out date')).toBe('15/05/2027');

    await fillDatePicker(user, 'Check-in date', '20052027');

    expect(dateValue('Check-in date')).toBe('20/05/2027');
    expect(dateValue('Check-out date')).toBe('DD/MM/YYYY');
  });
});
