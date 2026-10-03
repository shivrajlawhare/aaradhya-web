import { ThemeProvider } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import EventDetailsStep from '../../src/pages/event-creation/event-details-step';
import EventWizardShell from '../../src/pages/event-creation/event-wizard-shell';
import WizardStepPlaceholder from '../../src/pages/event-creation/wizard-step-placeholder';
import { WIZARD_STEPS } from '../../src/pages/event-creation/wizard-steps';
import { WIZARD_STORAGE_KEY } from '../../src/stores/event-wizard-context';
import { theme } from '../../src/theme/theme';
import { mockMatchMedia } from '../support/match-media';

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

const mockMasterListsApi = () => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/event-types')) {
        return jsonResponse(200, [
          {
            id: 'et-1',
            name: 'Wedding',
            active: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'et-2',
            name: 'Haldi',
            active: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'et-3',
            name: 'Retired Type',
            active: false,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ]);
      }
      if (url.includes('/venues')) {
        return jsonResponse(200, [
          {
            id: 'v-1',
            name: 'Poolside',
            defaultVenueCost: 60000,
            active: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'v-2',
            name: 'Half Banquet',
            defaultVenueCost: 60000,
            active: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'v-3',
            name: 'Old Hall',
            defaultVenueCost: 10000,
            active: false,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ]);
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
                <Route
                  path={WIZARD_STEPS[0]!.path}
                  element={
                    <EventWizardShell step="client-details">
                      <WizardStepPlaceholder step="client-details" />
                    </EventWizardShell>
                  }
                />
                <Route
                  path={WIZARD_STEPS[1]!.path}
                  element={
                    <EventWizardShell step="event-details">
                      <EventDetailsStep />
                    </EventWizardShell>
                  }
                />
                {WIZARD_STEPS.slice(2).map((step) => (
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
              </Routes>
            </MemoryRouter>
          </LocalizationProvider>
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>
  );
};

const eventDetailsPath = WIZARD_STEPS[1]!.path;

// MUI X's DatePicker has no single <input> to fireEvent.change — its field
// is a group of separate Day/Month/Year sections (role="spinbutton"),
// filled by typing digits into the first section and letting each section
// auto-advance, the same pattern event-detail-page.test.tsx's own
// fillDatePicker already established for session-form.tsx's identical
// DatePicker usage. Digit order is DD/MM/YYYY — theme.ts's own MuiDatePicker
// defaultProps (format: 'DD/MM/YYYY'), so Day is the first section, not
// Month.
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

const selectOption = async (labelText: string, optionName: string) => {
  fireEvent.mouseDown(await screen.findByLabelText(labelText));
  fireEvent.click(await screen.findByRole('option', { name: optionName }));
};

const fillMinimalEvent = async (
  user: ReturnType<typeof userEvent.setup>,
  { eventType = 'Wedding', venue = 'Poolside', ddmmyyyy = '12092026' } = {}
) => {
  await selectOption('Event Type', eventType);
  await selectOption('Venue', venue);
  await fillDatePicker(user, 'Start date', ddmmyyyy);
  await fillDatePicker(user, 'End date', ddmmyyyy);
};

beforeEach(() => {
  sessionStorage.clear();
  mockMatchMedia(true);
  mockMasterListsApi();
});

afterEach(() => {
  vi.unstubAllGlobals();
  // vi.spyOn(window, 'confirm') returns the same spy instance across every
  // `it()` in this file (window.confirm is never torn down between tests)
  // — without restoring it here, a later test's own toHaveBeenCalledTimes
  // assertion silently includes call counts left over from an earlier
  // test's own spy usage.
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe('EventDetailsStep', () => {
  it('offers only active Event Types plus a Custom… option', async () => {
    renderWizard(eventDetailsPath);
    fireEvent.mouseDown(await screen.findByLabelText('Event Type'));
    await screen.findByRole('option', { name: 'Wedding' });

    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Select an event type', 'Wedding', 'Haldi', 'Custom…']);
  });

  it('offers only active Venues, no custom option', async () => {
    renderWizard(eventDetailsPath);
    fireEvent.mouseDown(await screen.findByLabelText('Venue'));
    await screen.findByRole('option', { name: 'Poolside' });

    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Select a venue', 'Poolside', 'Half Banquet']);
  });

  it('shows a free-text field only when Custom… Event Type is selected', async () => {
    renderWizard(eventDetailsPath);
    await selectOption('Event Type', 'Custom…');

    expect(screen.getByLabelText('Custom event type')).toBeInTheDocument();
  });

  it("auto-fills Venue Cost from the selected Venue's defaultVenueCost, and it stays editable", async () => {
    renderWizard(eventDetailsPath);
    await selectOption('Venue', 'Poolside');

    expect(screen.getByLabelText('Venue Cost')).toHaveValue(60000);

    fireEvent.change(screen.getByLabelText('Venue Cost'), { target: { value: '65000' } });
    expect(screen.getByLabelText('Venue Cost')).toHaveValue(65000);
  });

  it('"Next: Accommodation" is disabled until at least one Session is added', async () => {
    const user = userEvent.setup();
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');

    expect(screen.getByRole('button', { name: 'Next: Accommodation →' })).toBeDisabled();

    await fillMinimalEvent(user);
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

    // findByRole alone only waits for the button to exist (it always has,
    // just disabled) — the disabled -> enabled transition itself needs its
    // own retrying assertion.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next: Accommodation →' })).toBeEnabled());
  });

  it('"+ Add Event" appends a row with the six Event Details columns and clears the form', async () => {
    const user = userEvent.setup();
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');
    await fillMinimalEvent(user);
    fireEvent.change(screen.getByLabelText('Pax'), { target: { value: '200' } });
    expect(screen.getByLabelText('Pax')).toHaveValue(200);

    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

    let row: HTMLElement | null = null;
    await waitFor(() => {
      row = screen.getByText('Wedding').closest('tr');
      expect(row).not.toBeNull();
    });
    if (!row) {
      throw new Error('expected a row to render');
    }
    expect(within(row).getByText('12/09/2026')).toBeInTheDocument();
    expect(within(row).getByText('200')).toBeInTheDocument();
    expect(within(row).getByText('Poolside')).toBeInTheDocument();
    expect(within(row).getByText('60000')).toBeInTheDocument();
    // Form cleared for the next entry.
    expect(screen.getByLabelText('Pax')).toHaveValue(0);
  });

  // The clock-face StaticTimePicker has no reliable jsdom interaction path
  // (no real layout geometry to click against) — Duration's own formatting
  // is unit-tested directly (tests/utils/quotation-formatting.test.ts).
  // This verifies the table actually calls that formatter with a row's
  // stored times, via a row seeded straight into the wizard store instead
  // of typed through the clock UI.
  it('renders Duration using the shared quotation-formatting helper for an already-entered row', async () => {
    sessionStorage.setItem(
      WIZARD_STORAGE_KEY,
      JSON.stringify({
        'event-details': {
          sessions: [
            {
              id: 'session-1',
              sessionType: 'Wedding',
              venue: 'Poolside',
              venueCost: 60000,
              pax: 200,
              startDate: '2026-09-12',
              endDate: '2026-09-12',
              startTime: '18:00',
              endTime: '22:00',
            },
          ],
        },
      })
    );
    renderWizard(eventDetailsPath);

    expect(await screen.findByText('6pm to 10pm')).toBeInTheDocument();
  });

  it('supports two Sessions on the same date with different venues, kept as distinct rows', async () => {
    const user = userEvent.setup();
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');

    await fillMinimalEvent(user, { eventType: 'Haldi', venue: 'Poolside', ddmmyyyy: '26022027' });
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    await screen.findByText('Haldi');

    await fillMinimalEvent(user, { eventType: 'Wedding', venue: 'Half Banquet', ddmmyyyy: '26022027' });
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(await screen.findByText('Wedding')).toBeInTheDocument();
    const dateCells = screen.getAllByText('26/02/2027');
    expect(dateCells).toHaveLength(2);
    expect(screen.getByText('Poolside')).toBeInTheDocument();
    expect(screen.getByText('Half Banquet')).toBeInTheDocument();
  });

  it('blocks adding a row when End date is before Start date', async () => {
    const user = userEvent.setup();
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');
    await selectOption('Event Type', 'Wedding');
    await selectOption('Venue', 'Poolside');
    await fillDatePicker(user, 'Start date', '15092026');
    await fillDatePicker(user, 'End date', '10092026');

    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(await screen.findByText('End date must be on or after start date.')).toBeInTheDocument();
    expect(screen.queryByText('Wedding', { selector: 'td' })).not.toBeInTheDocument();
  });

  it('removes a Session row with no confirmation when no Sessions & Items exist for that date', async () => {
    const user = userEvent.setup();
    renderWizard(eventDetailsPath);
    vi.spyOn(window, 'confirm');
    await screen.findByLabelText('Event Type');
    await fillMinimalEvent(user);
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    await screen.findByText('Wedding');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Wedding row' }));

    expect(screen.queryByText('Wedding')).not.toBeInTheDocument();
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it('prompts for confirmation before removing a Session whose date has Sessions & Items entered, and clears just that date on confirm', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      WIZARD_STORAGE_KEY,
      JSON.stringify({
        'sessions-items': {
          byDate: { '2026-09-12': [{ type: 'Ceremony', name: 'Muhurta' }], '2026-09-13': [{ type: 'Ceremony' }] },
        },
      })
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');
    await fillMinimalEvent(user, { ddmmyyyy: '12092026' });
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    await screen.findByText('Wedding');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Wedding row' }));

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Wedding')).not.toBeInTheDocument();
    const stored = JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) ?? '{}');
    expect(stored['sessions-items'].byDate).toEqual({ '2026-09-13': [{ type: 'Ceremony' }] });
  });

  it('a multi-day Session removal checks/clears every date it spans, not just its start date', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      WIZARD_STORAGE_KEY,
      JSON.stringify({
        'sessions-items': { byDate: { '2026-09-13': [{ type: 'Ceremony' }] } },
      })
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');
    await selectOption('Event Type', 'Wedding');
    await selectOption('Venue', 'Poolside');
    await fillDatePicker(user, 'Start date', '12092026');
    await fillDatePicker(user, 'End date', '13092026');
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    await screen.findByText('Wedding');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Wedding row' }));

    // The entries live under 09-13, not the Session's own startDate
    // (09-12) — a date-range-unaware check (only ever looking at
    // row.startDate) would have missed this and removed the Session with
    // no prompt, leaving the 09-13 entries orphaned in the wizard store.
    expect(window.confirm).toHaveBeenCalledTimes(1);
    const stored = JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) ?? '{}');
    expect(stored['sessions-items'].byDate).toEqual({});
  });

  it('does not touch a date still covered by another remaining Session', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      WIZARD_STORAGE_KEY,
      JSON.stringify({
        'sessions-items': { byDate: { '2027-02-26': [{ type: 'Ceremony' }] } },
      })
    );
    vi.spyOn(window, 'confirm');
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');

    // Two same-date Sessions (STORY-065's own supported case) — both cover
    // the date the stored Sessions & Items entries live under.
    await fillMinimalEvent(user, { eventType: 'Haldi', venue: 'Poolside', ddmmyyyy: '26022027' });
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    await screen.findByText('Haldi');
    await fillMinimalEvent(user, { eventType: 'Wedding', venue: 'Half Banquet', ddmmyyyy: '26022027' });
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    await screen.findByText('Wedding');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Haldi row' }));

    // Wedding still covers 2027-02-26, so removing Haldi orphans nothing —
    // no prompt, and the stored entries survive untouched.
    expect(window.confirm).not.toHaveBeenCalled();
    expect(screen.getByText('Wedding')).toBeInTheDocument();
    const stored = JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) ?? '{}');
    expect(stored['sessions-items'].byDate).toEqual({ '2027-02-26': [{ type: 'Ceremony' }] });
  });

  it("declining the confirmation keeps both the Session row and its date's Sessions & Items", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      WIZARD_STORAGE_KEY,
      JSON.stringify({ 'sessions-items': { byDate: { '2026-09-12': [{ type: 'Ceremony' }] } } })
    );
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');
    await fillMinimalEvent(user, { ddmmyyyy: '12092026' });
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    await screen.findByText('Wedding');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Wedding row' }));

    expect(screen.getByText('Wedding')).toBeInTheDocument();
    const stored = JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) ?? '{}');
    expect(stored['sessions-items'].byDate['2026-09-12']).toEqual([{ type: 'Ceremony' }]);
  });

  it('renders the Setup section, all fields optional — adding a row untouched stores harmless defaults', async () => {
    const user = userEvent.setup();
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');

    expect(screen.getByText('Setup')).toBeInTheDocument();
    expect(screen.getByLabelText('Seating')).toBeInTheDocument();
    expect(screen.getByLabelText('Tables')).toBeInTheDocument();
    expect(screen.getByLabelText('Chairs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stage' })).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();

    await fillMinimalEvent(user);
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    await screen.findByText('Wedding');

    // Never blocked Next — Setup has no readiness check of its own.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next: Accommodation →' })).toBeEnabled());

    const stored = JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) ?? '{}');
    expect(stored['event-details'].sessions[0].setup).toEqual({
      seating: '',
      tableCount: 0,
      chairCount: 0,
      stage: false,
      buffet: false,
      registrationDesk: false,
      vipSeating: false,
      brideGroomSeating: false,
      notes: '',
    });
  });

  it('carries entered Setup details into the stored row and resets the form for the next entry', async () => {
    const user = userEvent.setup();
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');
    await fillMinimalEvent(user);

    await selectOption('Seating', 'Round Tables');
    fireEvent.change(screen.getByLabelText('Tables'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Chairs'), { target: { value: '200' } });
    await user.click(screen.getByRole('button', { name: 'Stage' }));
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Extra space near entrance' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    await screen.findByText('Wedding');

    const stored = JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) ?? '{}');
    expect(stored['event-details'].sessions[0].setup).toEqual({
      seating: 'RoundTables',
      tableCount: 20,
      chairCount: 200,
      stage: true,
      buffet: false,
      registrationDesk: false,
      vipSeating: false,
      brideGroomSeating: false,
      notes: 'Extra space near entrance',
    });

    // Form cleared for the next entry, same as every other field.
    expect(screen.getByLabelText('Tables')).toHaveValue(0);
    expect(screen.getByLabelText('Notes')).toHaveValue('');
  });

  it('carries the Notes for Department into the stored row, with the non-blocking pax warning (DEV-12)', async () => {
    const user = userEvent.setup();
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');
    await fillMinimalEvent(user);

    const notes = screen.getByRole('region', { name: 'Notes for Department' });
    fireEvent.change(within(notes).getByLabelText('Veg pax'), { target: { value: '4' } });
    fireEvent.change(within(notes).getByLabelText('Non-Veg pax'), { target: { value: '16' } });
    expect(within(notes).getByRole('status')).toHaveTextContent(/^Veg \+ Non-Veg \(20\) doesn’t match Pax \(\d+\)$/);
    await user.type(within(notes).getByLabelText('Maintenance'), 'Sound System{Enter}');
    fireEvent.change(within(notes).getByLabelText('Restaurant note'), {
      target: { value: 'Billing will be as per a la carte.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    await screen.findByText('Wedding');

    const stored = JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) ?? '{}');
    expect(stored['event-details'].sessions[0].departmentNotes).toEqual({
      vegPax: 4,
      nonVegPax: 16,
      maintenance: ['Sound System'],
      restaurantNote: 'Billing will be as per a la carte.',
    });
    expect(within(notes).getByLabelText('Veg pax')).toHaveValue(null);
  });

  it('carries entered Sessions forward across Back/Next between Step 2 and Step 1', async () => {
    const user = userEvent.setup();
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');
    await fillMinimalEvent(user);
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    await screen.findByText('Wedding');

    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect(screen.getByText('Client Details')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next: Event Details →' }));
    expect(await screen.findByText('Wedding')).toBeInTheDocument();
  });
});

describe('EventDetailsStep — edit an added row (DEV-06)', () => {
  const makeStoredRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'session-1',
    sessionType: 'Wedding',
    venue: 'Poolside',
    venueCost: 60000,
    pax: 200,
    startDate: '2026-09-12',
    endDate: '2026-09-12',
    startTime: '18:00',
    endTime: '22:00',
    setup: {
      seating: 'RoundTables',
      tableCount: 20,
      chairCount: 200,
      stage: true,
      buffet: false,
      registrationDesk: false,
      vipSeating: false,
      brideGroomSeating: false,
      notes: 'Near the pool',
    },
    ...overrides,
  });

  const seedRows = (sessions: unknown[]) => {
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ 'event-details': { sessions } }));
  };

  const storedSessions = () => JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) ?? '{}')['event-details'].sessions;

  const rowFor = (eventType: string) => {
    const row = screen.getByText(eventType, { selector: 'td' }).closest('tr');
    if (!row) {
      throw new Error(`expected a ${eventType} row`);
    }
    return row;
  };

  it('clicking a row loads all its fields and Setup into the entry card, in the Editing state', async () => {
    seedRows([makeStoredRow()]);
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');

    fireEvent.click(rowFor('Wedding'));

    expect(screen.getByRole('combobox', { name: 'Event Type' })).toHaveTextContent('Wedding');
    expect(screen.getByRole('combobox', { name: 'Venue' })).toHaveTextContent('Poolside');
    expect(screen.getByLabelText('Venue Cost')).toHaveValue(60000);
    expect(screen.getByLabelText('Pax')).toHaveValue(200);
    expect(screen.getByRole('combobox', { name: 'Seating' })).toHaveTextContent('Round Tables');
    expect(screen.getByLabelText('Tables')).toHaveValue(20);
    expect(screen.getByLabelText('Chairs')).toHaveValue(200);
    expect(screen.getByRole('button', { name: 'Stage' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Notes')).toHaveValue('Near the pool');
    expect(
      within(screen.getByRole('group', { name: 'Start date' })).getByRole('spinbutton', { name: 'Year' })
    ).toHaveTextContent('2026');

    expect(rowFor('Wedding')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Save Event' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel edit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Event' })).not.toBeInTheDocument();
  });

  it('Save Event replaces the row in place — no duplicate, dates/times/Setup kept, order kept', async () => {
    seedRows([makeStoredRow(), makeStoredRow({ id: 'session-2', sessionType: 'Haldi', pax: 120 })]);
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');

    fireEvent.click(rowFor('Wedding'));
    fireEvent.change(screen.getByLabelText('Pax'), { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Event' }));

    await waitFor(() => expect(within(rowFor('Wedding')).getByText('250')).toBeInTheDocument());
    const sessions = storedSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions.map((session: { id: string }) => session.id)).toEqual(['session-1', 'session-2']);
    expect(sessions[0]).toMatchObject({
      id: 'session-1',
      sessionType: 'Wedding',
      pax: 250,
      startDate: '2026-09-12',
      endDate: '2026-09-12',
      startTime: '18:00',
      endTime: '22:00',
    });
    expect(sessions[0].setup).toMatchObject({ seating: 'RoundTables', tableCount: 20, stage: true });

    // Back to adding, with a cleared card.
    expect(screen.getByRole('button', { name: 'Add Event' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel edit' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Pax')).toHaveValue(0);
    expect(rowFor('Wedding')).toHaveAttribute('aria-selected', 'false');
  });

  it('Cancel edit clears the entry card and leaves the row untouched', async () => {
    seedRows([makeStoredRow()]);
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');

    fireEvent.click(rowFor('Wedding'));
    fireEvent.change(screen.getByLabelText('Pax'), { target: { value: '999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel edit' }));

    expect(screen.getByLabelText('Pax')).toHaveValue(0);
    expect(screen.getByLabelText('Tables')).toHaveValue(0);
    expect(screen.getByRole('button', { name: 'Add Event' })).toBeInTheDocument();
    expect(storedSessions()[0].pax).toBe(200);
    expect(within(rowFor('Wedding')).getByText('200')).toBeInTheDocument();
  });

  it('removing the row being edited also resets the entry card', async () => {
    seedRows([makeStoredRow()]);
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');

    fireEvent.click(rowFor('Wedding'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove Wedding row' }));

    expect(screen.queryByText('Wedding', { selector: 'td' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Pax')).toHaveValue(0);
    expect(screen.getByRole('button', { name: 'Add Event' })).toBeInTheDocument();
    expect(storedSessions()).toHaveLength(0);
  });

  it('reopens a custom event type as "Custom…" with its text filled in', async () => {
    seedRows([makeStoredRow({ sessionType: 'Mehendi Night' })]);
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');

    fireEvent.click(rowFor('Mehendi Night'));

    expect(screen.getByRole('combobox', { name: 'Event Type' })).toHaveTextContent('Custom…');
    expect(screen.getByLabelText('Custom event type')).toHaveValue('Mehendi Night');
  });

  it('shows the "Added events" summary as N events · N guests (D19)', async () => {
    seedRows([makeStoredRow(), makeStoredRow({ id: 'session-2', sessionType: 'Haldi', pax: 120 })]);
    renderWizard(eventDetailsPath);

    expect(await screen.findByText('2 events · 320 guests')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Added events' })).toBeInTheDocument();
  });
});

describe('Range-limited End date (DEV-19, V5)', () => {
  // The picker field around a date group, and its calendar button.
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

  it('opens the End date calendar on the Start date’s month, with earlier days disabled', async () => {
    const user = userEvent.setup();
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');
    await fillDatePicker(user, 'Start date', '02032027');

    await user.click(within(dateField('End date')).getByRole('button', { name: /choose date/i }));
    const calendar = await screen.findByRole('dialog');

    expect(within(calendar).getByText('March 2027')).toBeInTheDocument();
    expect(within(calendar).getByRole('gridcell', { name: '1' })).toBeDisabled();
    expect(within(calendar).getByRole('gridcell', { name: '2' })).toBeEnabled();
  });

  it('clears the End date when the Start date moves past it', async () => {
    const user = userEvent.setup();
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');
    await fillDatePicker(user, 'Start date', '02032027');
    await fillDatePicker(user, 'End date', '05032027');
    expect(dateValue('End date')).toBe('05/03/2027');

    await fillDatePicker(user, 'Start date', '10032027');

    expect(dateValue('Start date')).toBe('10/03/2027');
    expect(dateValue('End date')).toBe('DD/MM/YYYY');
  });
});
