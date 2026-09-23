import { ThemeProvider } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import EventWizardShell from '../../src/pages/event-creation/event-wizard-shell';
import SessionsItemsStep from '../../src/pages/event-creation/sessions-items-step';
import WizardStepPlaceholder from '../../src/pages/event-creation/wizard-step-placeholder';
import { WIZARD_STEPS } from '../../src/pages/event-creation/wizard-steps';
import { WIZARD_STORAGE_KEY } from '../../src/stores/event-wizard-context';
import { theme } from '../../src/theme/theme';
import { mockMatchMedia } from '../support/match-media';

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

let menuItems: { id: string; name: string; defaultCostPerPlate: number; createdAt: string; updatedAt: string }[] = [];

const mockMenuItemsApi = () => {
  menuItems = [
    {
      id: 'mi-1',
      name: 'Paneer Tikka',
      defaultCostPerPlate: 150,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/menu-items') && (!init || init.method === undefined || init.method === 'GET')) {
        const search = new URL(url, 'http://localhost').searchParams.get('search')?.toLowerCase() ?? '';
        const filtered = search ? menuItems.filter((item) => item.name.toLowerCase().includes(search)) : menuItems;
        return jsonResponse(200, filtered);
      }
      if (url.includes('/menu-items') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as { name: string };
        const existing = menuItems.find((item) => item.name.trim().toLowerCase() === body.name.trim().toLowerCase());
        if (existing) {
          return jsonResponse(409, {
            error: { code: 'MENU_ITEM_NAME_TAKEN', message: 'A Menu Item with that name already exists.' },
          });
        }
        const created = {
          id: `mi-${menuItems.length + 1}`,
          name: body.name,
          defaultCostPerPlate: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        };
        menuItems.push(created);
        return jsonResponse(201, created);
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
                {WIZARD_STEPS.filter((step) => step.id !== 'sessions-items').map((step) => (
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
                  path={WIZARD_STEPS[3]!.path}
                  element={
                    <EventWizardShell step="sessions-items">
                      <SessionsItemsStep />
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

const sessionsItemsPath = WIZARD_STEPS[3]!.path;

const TWO_DAY_WEDDING = {
  id: 's1',
  sessionType: 'Wedding',
  venue: 'Poolside',
  venueCost: 60000,
  pax: 200,
  startDate: '2026-09-12',
  endDate: '2026-09-13',
  startTime: '',
  endTime: '',
};

const seedEventDetails = (sessions: unknown[]) => {
  const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
  const parsed = raw ? JSON.parse(raw) : {};
  sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ ...parsed, 'event-details': { sessions } }));
};

const selectOption = async (labelText: string, optionName: string) => {
  fireEvent.mouseDown(screen.getByLabelText(labelText));
  fireEvent.click(await screen.findByRole('option', { name: optionName }));
};

beforeEach(() => {
  sessionStorage.clear();
  mockMatchMedia(true);
  mockMenuItemsApi();
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('SessionsItemsStep', () => {
  it('renders one date tab per distinct calendar date spanned by Step 2 Sessions, including a multi-day span', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);

    expect(await screen.findByRole('tab', { name: '12/09/2026' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '13/09/2026' })).toBeInTheDocument();
  });

  it('shows a reminder line naming the date’s Session and venue, pulled from Event Details', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);

    expect(
      await screen.findByText(/Wedding — Venue for this date: Poolside · 60,000\/- \(from Event Details\)/)
    ).toBeInTheDocument();
  });

  it('adds a Ceremony Event with every field blank, matching the reference quotations’ valid bare row', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });

    fireEvent.click(screen.getByRole('button', { name: 'Add Ceremony Event' }));

    expect(await screen.findByText('(blank ceremony row)')).toBeInTheDocument();
  });

  it('adds a Ceremony Event with a preset name, and it can be removed', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });

    await selectOption('Event Name', 'Muhurta');
    fireEvent.click(screen.getByRole('button', { name: 'Add Ceremony Event' }));
    expect(await screen.findByText('Muhurta')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Muhurta row' }));
    expect(screen.queryByText('Muhurta')).not.toBeInTheDocument();
  });

  it('clicking an added Ceremony row re-populates the form for editing, and saving replaces it rather than duplicating', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    await selectOption('Event Name', 'Muhurta');
    fireEvent.click(screen.getByRole('button', { name: 'Add Ceremony Event' }));
    await screen.findByText('Muhurta');

    fireEvent.click(screen.getByText('Muhurta'));
    expect(await screen.findByRole('button', { name: 'Save Ceremony Event' })).toBeInTheDocument();

    await selectOption('Event Name', 'Cake Cutting');
    fireEvent.click(screen.getByRole('button', { name: 'Save Ceremony Event' }));

    expect(await screen.findByText('Cake Cutting')).toBeInTheDocument();
    expect(screen.queryByText('Muhurta')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Cake Cutting/)).toHaveLength(1);
  });

  it('the L.S. toggle relabels Cost per Plate to Flat Cost, and the preview line reflects the current toggle/pax', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });

    expect(screen.getByLabelText('Cost per Plate')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Pax'), { target: { value: '200' } });
    expect(screen.getByText('Shown on Quotation as: 200')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Limited Seating'));

    expect(screen.getByLabelText('Flat Cost')).toBeInTheDocument();
    expect(screen.getByText('Shown on Quotation as: L.S. (200pax)')).toBeInTheDocument();
  });

  it('stores Pax/Cost as 0, not NaN, when the field is left blank', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });

    await selectOption('Meal Name', 'Dinner');
    // Pax/Cost per Plate default to 0 already — clearing them (a cleared
    // number input's valueAsNumber is NaN, not 0) must not leak NaN/null
    // into the stored row or its "Shown on Quotation as" display.
    fireEvent.change(screen.getByLabelText('Pax'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Food/Dining Event' }));

    await waitFor(() => expect(screen.getByText(/Dinner/)).toBeInTheDocument());
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    const stored = JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) ?? '{}');
    const storedItem = stored['sessions-items'].byDate['2026-09-12'][0];
    expect(storedItem.pax).toBe(0);
  });

  it('disables Cancel edit while a Food/Dining submit (menu item creation) is in flight', async () => {
    const user = userEvent.setup();
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    await selectOption('Meal Name', 'Lunch');
    fireEvent.click(screen.getByRole('button', { name: 'Add Food/Dining Event' }));
    // " · " disambiguates the added list row's own text ("Lunch · 0 · 0")
    // from the Meal Name select, which also shows the bare word "Lunch" as
    // its own selected value once chosen.
    fireEvent.click(await screen.findByText(/Lunch · /));
    await screen.findByRole('button', { name: 'Save Food/Dining Event' });

    // The mock POST /menu-items otherwise resolves within the same tick,
    // leaving no real window to observe the pending state — held open here
    // with a manually-resolved promise so the assertion below can actually
    // catch the button disabled mid-flight, not just before/after it.
    let resolveCreate: (() => void) | undefined;
    const original = globalThis.fetch;
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/menu-items') && init?.method === 'POST') {
          return new Promise((resolve) => {
            resolveCreate = () =>
              resolve(
                new Response(
                  JSON.stringify({
                    id: 'mi-new',
                    name: 'Brand New Item',
                    defaultCostPerPlate: 0,
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                  }),
                  { status: 201, headers: { 'content-type': 'application/json' } }
                )
              );
          });
        }
        return original(input, init);
      })
    );

    const menuSearchInput = screen.getByLabelText('Menu items');
    await user.click(menuSearchInput);
    await user.type(menuSearchInput, 'Brand New Item');
    fireEvent.click(await screen.findByText('Add "Brand New Item" as a new menu item'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Food/Dining Event' }));

    // The create-menu-item mutation is now in flight — Cancel edit must not
    // be clickable until it settles, or a click here could leave the
    // in-flight save silently re-applying to a row the user believed
    // they'd backed out of editing.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel edit' })).toBeDisabled());

    resolveCreate?.();
  });

  it('adds a Food/Dining Event and displays Pax using the same L.S. formatting rule in the list', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });

    await selectOption('Meal Name', 'Lunch');
    fireEvent.change(screen.getByLabelText('Pax'), { target: { value: '150' } });
    fireEvent.click(screen.getByLabelText('Limited Seating'));
    fireEvent.change(screen.getByLabelText('Flat Cost'), { target: { value: '20000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Food/Dining Event' }));

    // "20,000" (the list row's formatted Cost) only ever appears there, not
    // in the form itself (a plain unformatted number input) — a safer
    // anchor to wait on than the L.S. text, which the form's own live
    // preview line already shows before Add is even clicked, and would
    // therefore make waitFor succeed immediately without actually waiting
    // for the async submit (menu item resolution) to finish.
    await waitFor(() => expect(screen.getByText(/20,000/)).toBeInTheDocument());
    expect(screen.getByText(/L\.S\. \(150pax\)/)).toBeInTheDocument();
  });

  it('an existing Menu Item is attached by search without creating a duplicate', async () => {
    const user = userEvent.setup();
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    await selectOption('Meal Name', 'Lunch');

    const menuSearchInput = screen.getByLabelText('Menu items');
    await user.click(menuSearchInput);
    await user.type(menuSearchInput, 'Paneer');
    fireEvent.click(await screen.findByText('Paneer Tikka'));
    fireEvent.click(screen.getByRole('button', { name: 'Add Food/Dining Event' }));

    await waitFor(() => expect(screen.getByText(/Paneer Tikka/)).toBeInTheDocument());
    expect(menuItems).toHaveLength(1);
  });

  it('adding a not-yet-existing Menu Item by name persists it via createMenuItem, for future reuse', async () => {
    const user = userEvent.setup();
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    await selectOption('Meal Name', 'Lunch');

    const menuSearchInput = screen.getByLabelText('Menu items');
    await user.click(menuSearchInput);
    await user.type(menuSearchInput, 'Gulab Jamun');
    fireEvent.click(await screen.findByText('Add "Gulab Jamun" as a new menu item'));
    fireEvent.click(screen.getByRole('button', { name: 'Add Food/Dining Event' }));

    await waitFor(() => expect(screen.getByText(/Gulab Jamun/)).toBeInTheDocument());
    expect(menuItems.some((item) => item.name === 'Gulab Jamun')).toBe(true);
  });

  it('switching date tabs shows only that date’s own entries and resets the entry forms', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    await selectOption('Event Name', 'Muhurta');
    fireEvent.click(screen.getByRole('button', { name: 'Add Ceremony Event' }));
    await screen.findByText('Muhurta');

    fireEvent.click(screen.getByRole('tab', { name: '13/09/2026' }));
    await waitFor(() => expect(screen.queryByText('Muhurta')).not.toBeInTheDocument());

    // Submitting immediately after switching (without re-selecting
    // anything) produces a blank row, not a duplicate "Muhurta" — proof the
    // entry form itself was actually reset, not just that the list
    // re-filtered to this date.
    fireEvent.click(screen.getByRole('button', { name: 'Add Ceremony Event' }));
    expect(await screen.findByText('(blank ceremony row)')).toBeInTheDocument();
    expect(screen.queryByText('Muhurta')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '12/09/2026' }));
    expect(await screen.findByText('Muhurta')).toBeInTheDocument();
  });

  it('Next is disabled until every date tab has been visited at least once, then enables', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });

    expect(screen.getByRole('button', { name: 'Next: Review & Quotation →' })).toBeDisabled();

    fireEvent.click(screen.getByRole('tab', { name: '13/09/2026' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Next: Review & Quotation →' })).toBeEnabled());
  });

  it('a date tab needs no Ceremony/Food-Dining rows to count as visited — an empty date is valid', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    fireEvent.click(screen.getByRole('tab', { name: '13/09/2026' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Next: Review & Quotation →' })).toBeEnabled());
    const stored = JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) ?? '{}');
    expect(stored['sessions-items'].byDate['2026-09-13']).toBeUndefined();
  });

  it('carries entered Sessions & Items data forward across Back/Next between Step 4 and Step 3', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    sessionStorage.setItem(
      WIZARD_STORAGE_KEY,
      JSON.stringify({
        ...parsed,
        accommodation: {
          checkInDate: '2026-09-12',
          checkInTime: '',
          checkOutDate: '2026-09-13',
          checkOutTime: '',
          roomLines: [],
        },
      })
    );
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    await selectOption('Event Name', 'Muhurta');
    fireEvent.click(screen.getByRole('button', { name: 'Add Ceremony Event' }));
    await screen.findByText('Muhurta');

    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect(screen.getByText('Accommodation')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next: Sessions & Items →' }));
    expect(await screen.findByText('Muhurta')).toBeInTheDocument();
  });
});
