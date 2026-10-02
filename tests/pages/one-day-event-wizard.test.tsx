import { useRef } from 'react';
import { ThemeProvider } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import { ToastProvider } from '../../src/components/ui/toast-provider';
import ClientDetailsStep from '../../src/pages/event-creation/client-details-step';
import EventWizardShell from '../../src/pages/event-creation/event-wizard-shell';
import ReviewStep from '../../src/pages/event-creation/review-step';
import WizardStepPlaceholder from '../../src/pages/event-creation/wizard-step-placeholder';
import { WIZARD_STEPS } from '../../src/pages/event-creation/wizard-steps';
import { AuthProvider, SESSION_STORAGE_KEY } from '../../src/stores/auth-context';
import { WIZARD_STORAGE_KEY } from '../../src/stores/event-wizard-context';
import { theme } from '../../src/theme/theme';
import { EXAMPLE_4_ROOM_TYPES, EXAMPLE_4_TEMPLATE, EXAMPLE_4_VENUES } from '../support/example-quotation-4';
import { mockMatchMedia } from '../support/match-media';

const APPLIED_MESSAGE = 'One Day Event template applied — review each step and change anything you need.';
const REPLACE_WARNING = 'Replace what you’ve entered with the One Day Event template?';

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

// What GET /settings/one-day-event-template currently returns — a test may
// swap it to stand in for a template edited in Settings.
let currentTemplate: typeof EXAMPLE_4_TEMPLATE = EXAMPLE_4_TEMPLATE;

const mockApi = () => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/settings/one-day-event-template')) {
        return jsonResponse(200, currentTemplate);
      }
      if (url.includes('/venues')) {
        return jsonResponse(200, EXAMPLE_4_VENUES);
      }
      if (url.includes('/room-types')) {
        return jsonResponse(200, EXAMPLE_4_ROOM_TYPES);
      }
      throw new Error(`Unhandled request: ${url}`);
    })
  );
};

const ReviewStepRoute = () => {
  const submitRef = useRef<() => void>(() => {});
  return (
    <EventWizardShell step="review" onNext={() => submitRef.current()}>
      <ReviewStep registerSubmit={(submit) => (submitRef.current = submit)} />
    </EventWizardShell>
  );
};

// Steps 1 and 5 are real; 2–4 are placeholders, so Next walks straight
// through them on their stored readiness alone.
const renderWizard = (initialPath: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <ToastProvider>
              <AuthProvider>
                <MemoryRouter initialEntries={[initialPath]}>
                  <Routes>
                    <Route
                      path={WIZARD_STEPS[0]!.path}
                      element={
                        <EventWizardShell step="client-details">
                          <ClientDetailsStep />
                        </EventWizardShell>
                      }
                    />
                    {WIZARD_STEPS.slice(1, 4).map((step) => (
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
                  </Routes>
                </MemoryRouter>
              </AuthProvider>
            </ToastProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>
  );

const clientDetailsPath = WIZARD_STEPS[0]!.path;
const eventDetailsPath = WIZARD_STEPS[1]!.path;

// Digit order is DD/MM/YYYY (theme.ts's MuiDatePicker defaultProps).
const fillEventDate = async (user: ReturnType<typeof userEvent.setup>, ddmmyyyy: string) => {
  const dialog = screen.getByRole('dialog', { name: 'Start a One Day Event' });
  const group = within(dialog).getByRole('group', { name: /Event date/ });
  const firstSection = within(group).getAllByRole('spinbutton')[0];
  if (!firstSection) {
    throw new Error('expected the Event date field to have date sections');
  }
  await user.click(firstSection);
  await user.keyboard(ddmmyyyy);
};

const storedWizard = () => JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) ?? '{}');

const walkToReview = async (user: ReturnType<typeof userEvent.setup>) => {
  for (let step = 1; step <= 4; step += 1) {
    const next = await screen.findByRole('button', { name: /^Next:/ });
    await waitFor(() => expect(next).toBeEnabled());
    await user.click(next);
  }
  await screen.findByRole('button', { name: 'Generate Quotation' });
};

beforeEach(() => {
  sessionStorage.clear();
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ token: 'signed-jwt', user: { id: 'manager-1', name: 'Priya Nair', role: 'EventManager' } })
  );
  currentTemplate = EXAMPLE_4_TEMPLATE;
  mockMatchMedia(true);
  mockApi();
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
  localStorage.clear();
  mockMatchMedia(false);
});

describe('One Day Event (DEV-11)', () => {
  it('is offered on every wizard step, and Prefill event waits for the Event date', async () => {
    const user = userEvent.setup();
    renderWizard(eventDetailsPath);

    await user.click(screen.getByRole('button', { name: 'One Day Event' }));

    const dialog = await screen.findByRole('dialog', { name: 'Start a One Day Event' });
    expect(within(dialog).getByRole('button', { name: 'Prefill event' })).toBeDisabled();
    expect(within(dialog).queryByText(REPLACE_WARNING)).not.toBeInTheDocument();
  });

  it('prefills every step from the template, lands on step 1 with the alert, and reaches Grand Total Rs. 5,02,400 /- with no rooms booked', async () => {
    const user = userEvent.setup();
    renderWizard(clientDetailsPath);

    await user.click(screen.getByRole('button', { name: 'One Day Event' }));
    await fillEventDate(user, '12122026');
    const prefill = screen.getByRole('button', { name: 'Prefill event' });
    await waitFor(() => expect(prefill).toBeEnabled());
    await user.click(prefill);

    expect(await screen.findByText(APPLIED_MESSAGE)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Start a One Day Event' })).not.toBeInTheDocument()
    );
    // Step 1 is left for the client's contacts (the POC).
    expect(screen.getAllByLabelText('Name').every((field) => (field as HTMLInputElement).value === '')).toBe(true);
    expect(storedWizard()['event-details'].sessions[0]).toMatchObject({ startDate: '2026-12-12', venueCost: 120000 });

    await walkToReview(user);

    // 1,20,000 venue + 2,48,000 food × 1.05 + 1,15,000 + 0 + 7,000; rooms ₹ 0.
    expect(screen.getByText('5,02,400')).toBeInTheDocument();
    expect(screen.getByText('Bhatji')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Event Type' })).toHaveTextContent('Wedding');
  });

  it('warns before replacing entered data, keeps it on Cancel, and replaces it on Replace', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      WIZARD_STORAGE_KEY,
      JSON.stringify({
        'client-details': {
          contacts: [{ id: 'poc', roleLabel: 'Point of Contact', isDefault: true, name: 'Asha', contactNumber: '9' }],
        },
      })
    );
    renderWizard(clientDetailsPath);

    await user.click(screen.getByRole('button', { name: 'One Day Event' }));
    const dialog = await screen.findByRole('dialog', { name: 'Start a One Day Event' });
    expect(within(dialog).getByText(REPLACE_WARNING)).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Prefill event' })).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByDisplayValue('Asha')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'One Day Event' }));
    await fillEventDate(user, '12122026');
    const replace = screen.getByRole('button', { name: 'Replace' });
    await waitFor(() => expect(replace).toBeEnabled());
    await user.click(replace);

    expect(await screen.findByText(APPLIED_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Asha')).not.toBeInTheDocument();
    expect(storedWizard()['event-details'].sessions).toHaveLength(1);
  });

  it('uses the template as edited in Settings for a later prefill', async () => {
    const user = userEvent.setup();
    currentTemplate = {
      ...EXAMPLE_4_TEMPLATE,
      meals: EXAMPLE_4_TEMPLATE.meals.map((meal) =>
        meal.mealName === 'Lunch' ? { ...meal, costPerPlate: 500 } : meal
      ),
    };
    renderWizard(clientDetailsPath);

    await user.click(screen.getByRole('button', { name: 'One Day Event' }));
    await fillEventDate(user, '12122026');
    const prefill = screen.getByRole('button', { name: 'Prefill event' });
    await waitFor(() => expect(prefill).toBeEnabled());
    await user.click(prefill);
    await screen.findByText(APPLIED_MESSAGE);
    await walkToReview(user);

    // Lunch 500 × 500: food 2,73,000 × 1.05 = 2,86,650 → 1,20,000 + 2,86,650 + 1,22,000.
    expect(screen.getByText('5,28,650')).toBeInTheDocument();
  });
});
