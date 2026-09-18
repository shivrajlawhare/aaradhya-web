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
          { id: 'et-1', name: 'Wedding', active: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
          { id: 'et-2', name: 'Haldi', active: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
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
    </QueryClientProvider>,
  );
};

const eventDetailsPath = WIZARD_STEPS[1]!.path;

// MUI X's DatePicker has no single <input> to fireEvent.change — its field
// is a group of separate Month/Day/Year sections (role="spinbutton"),
// filled by typing digits into the first section and letting each section
// auto-advance, the same pattern event-detail-page.test.tsx's own
// fillDatePicker already established for session-form.tsx's identical
// DatePicker usage.
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

const selectOption = async (labelText: string, optionName: string) => {
  fireEvent.mouseDown(await screen.findByLabelText(labelText));
  fireEvent.click(await screen.findByRole('option', { name: optionName }));
};

const fillMinimalEvent = async (
  user: ReturnType<typeof userEvent.setup>,
  { eventType = 'Wedding', venue = 'Poolside', mmddyyyy = '09122026' } = {},
) => {
  await selectOption('Event Type', eventType);
  await selectOption('Venue', venue);
  await fillDatePicker(user, 'Start date', mmddyyyy);
  await fillDatePicker(user, 'End date', mmddyyyy);
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
      }),
    );
    renderWizard(eventDetailsPath);

    expect(await screen.findByText('6pm to 10pm')).toBeInTheDocument();
  });

  it('supports two Sessions on the same date with different venues, kept as distinct rows', async () => {
    const user = userEvent.setup();
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');

    await fillMinimalEvent(user, { eventType: 'Haldi', venue: 'Poolside', mmddyyyy: '02262027' });
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    await screen.findByText('Haldi');

    await fillMinimalEvent(user, { eventType: 'Wedding', venue: 'Half Banquet', mmddyyyy: '02262027' });
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
    await fillDatePicker(user, 'Start date', '09152026');
    await fillDatePicker(user, 'End date', '09102026');

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
        'sessions-items': { byDate: { '2026-09-12': [{ type: 'Ceremony', name: 'Muhurta' }], '2026-09-13': [{ type: 'Ceremony' }] } },
      }),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');
    await fillMinimalEvent(user, { mmddyyyy: '09122026' });
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
      }),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');
    await selectOption('Event Type', 'Wedding');
    await selectOption('Venue', 'Poolside');
    await fillDatePicker(user, 'Start date', '09122026');
    await fillDatePicker(user, 'End date', '09132026');
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
      }),
    );
    vi.spyOn(window, 'confirm');
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');

    // Two same-date Sessions (STORY-065's own supported case) — both cover
    // the date the stored Sessions & Items entries live under.
    await fillMinimalEvent(user, { eventType: 'Haldi', venue: 'Poolside', mmddyyyy: '02262027' });
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    await screen.findByText('Haldi');
    await fillMinimalEvent(user, { eventType: 'Wedding', venue: 'Half Banquet', mmddyyyy: '02262027' });
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
      JSON.stringify({ 'sessions-items': { byDate: { '2026-09-12': [{ type: 'Ceremony' }] } } }),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderWizard(eventDetailsPath);
    await screen.findByLabelText('Event Type');
    await fillMinimalEvent(user, { mmddyyyy: '09122026' });
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    await screen.findByText('Wedding');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Wedding row' }));

    expect(screen.getByText('Wedding')).toBeInTheDocument();
    const stored = JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) ?? '{}');
    expect(stored['sessions-items'].byDate['2026-09-12']).toEqual([{ type: 'Ceremony' }]);
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
