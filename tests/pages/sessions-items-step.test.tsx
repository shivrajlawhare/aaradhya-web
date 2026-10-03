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

// The action row's buttons (D6) — distinct from the in-card submit
// buttons, which can share a label ("Add Food/Dining Event").
const actionButton = (name: 'Add Ceremony' | 'Add Food/Dining Event') =>
  within(screen.getByRole('toolbar', { name: 'Add items' })).getByRole('button', { name });

const openCeremonyCard = () => fireEvent.click(actionButton('Add Ceremony'));
const openFoodCard = () => fireEvent.click(actionButton('Add Food/Dining Event'));

const ceremonyCard = () => screen.getByRole('form', { name: 'Ceremony Events' });
const foodCard = () => screen.getByRole('form', { name: 'Food/Dining Events' });
// DEV-17: ceremonies and food/dining events share one list (R2).
const itemList = () => screen.getByRole('region', { name: 'Ceremonies & food/dining events' });

const submitCeremony = (name = 'Add Ceremony Event') =>
  fireEvent.click(within(ceremonyCard()).getByRole('button', { name }));
const submitFood = (name = 'Add Food/Dining Event') =>
  fireEvent.click(within(foodCard()).getByRole('button', { name }));

const addCeremony = async (eventName: string) => {
  await selectOption('Event Name', eventName);
  submitCeremony();
  await within(itemList()).findByText(eventName);
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

  describe('D6 action buttons', () => {
    it('starts with no card open and the combined list showing its empty text', async () => {
      seedEventDetails([TWO_DAY_WEDDING]);
      renderWizard(sessionsItemsPath);
      await screen.findByRole('tab', { name: '12/09/2026' });

      expect(screen.queryByRole('form')).not.toBeInTheDocument();
      expect(actionButton('Add Ceremony')).toHaveAttribute('aria-expanded', 'false');
      expect(actionButton('Add Food/Dining Event')).toHaveAttribute('aria-expanded', 'false');
      expect(within(itemList()).getByText('No ceremonies or food/dining events yet')).toBeInTheDocument();
    });

    it('toggles each card open and closed from its own button, one card at a time', async () => {
      seedEventDetails([TWO_DAY_WEDDING]);
      renderWizard(sessionsItemsPath);
      await screen.findByRole('tab', { name: '12/09/2026' });

      openCeremonyCard();
      expect(ceremonyCard()).toBeInTheDocument();
      expect(actionButton('Add Ceremony')).toHaveAttribute('aria-expanded', 'true');

      openFoodCard();
      expect(foodCard()).toBeInTheDocument();
      expect(screen.queryByRole('form', { name: 'Ceremony Events' })).not.toBeInTheDocument();
      expect(actionButton('Add Ceremony')).toHaveAttribute('aria-expanded', 'false');
      expect(actionButton('Add Food/Dining Event')).toHaveAttribute('aria-expanded', 'true');

      openFoodCard();
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
      expect(actionButton('Add Food/Dining Event')).toHaveAttribute('aria-expanded', 'false');
    });

    it('keeps the action row below the list (no longer sticky) as rows are added', async () => {
      seedEventDetails([TWO_DAY_WEDDING]);
      renderWizard(sessionsItemsPath);
      await screen.findByRole('tab', { name: '12/09/2026' });
      openCeremonyCard();
      await addCeremony('Muhurta');
      await addCeremony('Cake Cutting');
      await addCeremony('Engagement Sangeet');

      const toolbar = screen.getByRole('toolbar', { name: 'Add items' });
      expect(toolbar).not.toHaveStyle({ position: 'sticky' });
      expect(within(toolbar).getAllByRole('button')).toHaveLength(2);
      expect(within(itemList()).getAllByRole('button', { name: /^Remove / })).toHaveLength(3);
      expect(within(itemList()).getByText('Ceremonies & food/dining events · 3')).toBeInTheDocument();
    });
  });

  it('adds a Ceremony Event with every field blank, matching the reference quotations’ valid bare row', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    openCeremonyCard();

    submitCeremony();

    expect(await within(itemList()).findByText('(blank ceremony row)')).toBeInTheDocument();
    // The card stays open, ready for the next entry.
    expect(ceremonyCard()).toBeInTheDocument();
  });

  it('adds a Ceremony Event with a preset name, and it can be removed', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    openCeremonyCard();

    await addCeremony('Muhurta');

    fireEvent.click(within(itemList()).getByRole('button', { name: 'Remove Muhurta row' }));
    expect(within(itemList()).queryByText('Muhurta')).not.toBeInTheDocument();
    expect(within(itemList()).getByText('No ceremonies or food/dining events yet')).toBeInTheDocument();
  });

  it('clicking an added Ceremony row opens its card for editing, and saving replaces it rather than duplicating', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    openCeremonyCard();
    await addCeremony('Muhurta');
    // Close the card: clicking the row must reopen it.
    openCeremonyCard();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();

    const row = within(itemList()).getByRole('button', { name: /^Ceremony Muhurta/ });
    fireEvent.click(row);

    expect(ceremonyCard()).toBeInTheDocument();
    expect(actionButton('Add Ceremony')).toHaveAttribute('aria-expanded', 'true');
    expect(row).toHaveAttribute('aria-pressed', 'true');
    expect(within(ceremonyCard()).getByRole('button', { name: 'Cancel edit' })).toBeInTheDocument();

    await selectOption('Event Name', 'Cake Cutting');
    submitCeremony('Save Ceremony Event');

    expect(await within(itemList()).findByText('Cake Cutting')).toBeInTheDocument();
    expect(within(itemList()).queryByText('Muhurta')).not.toBeInTheDocument();
    expect(within(itemList()).getAllByRole('button', { name: /^Remove / })).toHaveLength(1);
    // Saved: the card stays open, empty, back in add mode.
    expect(within(ceremonyCard()).getByRole('button', { name: 'Add Ceremony Event' })).toBeInTheDocument();
    expect(within(ceremonyCard()).queryByRole('button', { name: 'Cancel edit' })).not.toBeInTheDocument();
  });

  it('Cancel edit empties the card and leaves the row unchanged', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    openCeremonyCard();
    await addCeremony('Muhurta');

    fireEvent.click(within(itemList()).getByRole('button', { name: /^Ceremony Muhurta/ }));
    fireEvent.click(within(ceremonyCard()).getByRole('button', { name: 'Cancel edit' }));

    expect(within(ceremonyCard()).getByRole('button', { name: 'Add Ceremony Event' })).toBeInTheDocument();
    expect(within(itemList()).getByRole('button', { name: /^Ceremony Muhurta/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('clicking a Food/Dining row while the Ceremony card is open switches to the Food card', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    openFoodCard();
    await selectOption('Meal Name', 'Dinner');
    submitFood();
    await within(itemList()).findByText('Dinner');
    openCeremonyCard();

    fireEvent.click(within(itemList()).getByRole('button', { name: /^Food\/dining Dinner/ }));

    expect(foodCard()).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Ceremony Events' })).not.toBeInTheDocument();
    expect(within(foodCard()).getByRole('button', { name: 'Save Food/Dining Event' })).toBeInTheDocument();
  });

  it('the L.S. toggle relabels Cost per Plate to Flat Cost, and the preview line reflects the current toggle/pax', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    openFoodCard();

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
    openFoodCard();

    await selectOption('Meal Name', 'Dinner');
    // Pax/Cost per Plate default to 0 already — clearing them (a cleared
    // number input's valueAsNumber is NaN, not 0) must not leak NaN/null
    // into the stored row or its "Shown on Quotation as" display.
    fireEvent.change(screen.getByLabelText('Pax'), { target: { value: '' } });
    submitFood();

    await within(itemList()).findByText('Dinner');
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
    openFoodCard();
    await selectOption('Meal Name', 'Lunch');
    submitFood();
    fireEvent.click(await within(itemList()).findByRole('button', { name: /^Food\/dining Lunch/ }));
    await within(foodCard()).findByRole('button', { name: 'Save Food/Dining Event' });

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
    submitFood('Save Food/Dining Event');

    // The create-menu-item mutation is now in flight — Cancel edit must not
    // be clickable until it settles, or a click here could leave the
    // in-flight save silently re-applying to a row the user believed
    // they'd backed out of editing.
    await waitFor(() => expect(within(foodCard()).getByRole('button', { name: 'Cancel edit' })).toBeDisabled());

    resolveCreate?.();
  });

  it('adds a Food/Dining Event and displays Pax using the same L.S. formatting rule in the list', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    openFoodCard();

    await selectOption('Meal Name', 'Lunch');
    fireEvent.change(screen.getByLabelText('Pax'), { target: { value: '150' } });
    fireEvent.click(screen.getByLabelText('Limited Seating'));
    fireEvent.change(screen.getByLabelText('Flat Cost'), { target: { value: '20000' } });
    submitFood();

    // The row only appears once the async submit (menu item resolution)
    // has finished.
    // The flat cost now shows twice: as the cost per plate and as the L.S.
    // total of the cost line (R3).
    expect(await within(itemList()).findAllByText('₹ 20,000')).toHaveLength(2);
    expect(within(itemList()).getByText('L.S. (150pax)')).toBeInTheDocument();
    expect(within(itemList()).getByText('Ceremonies & food/dining events · 1')).toBeInTheDocument();
  });

  it('an existing Menu Item is attached by search without creating a duplicate', async () => {
    const user = userEvent.setup();
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    openFoodCard();
    await selectOption('Meal Name', 'Lunch');

    const menuSearchInput = screen.getByLabelText('Menu items');
    await user.click(menuSearchInput);
    await user.type(menuSearchInput, 'Paneer');
    fireEvent.click(await screen.findByText('Paneer Tikka'));
    submitFood();

    expect(await within(itemList()).findByText('1. Paneer Tikka')).toBeInTheDocument();
    expect(menuItems).toHaveLength(1);
  });

  it('adding a not-yet-existing Menu Item by name persists it via createMenuItem, for future reuse', async () => {
    const user = userEvent.setup();
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    openFoodCard();
    await selectOption('Meal Name', 'Lunch');

    const menuSearchInput = screen.getByLabelText('Menu items');
    await user.click(menuSearchInput);
    await user.type(menuSearchInput, 'Gulab Jamun');
    fireEvent.click(await screen.findByText('Add "Gulab Jamun" as a new menu item'));
    submitFood();

    expect(await within(itemList()).findByText('1. Gulab Jamun')).toBeInTheDocument();
    expect(menuItems.some((item) => item.name === 'Gulab Jamun')).toBe(true);
  });

  it('switching date tabs shows only that date’s own entries and resets the entry forms', async () => {
    seedEventDetails([TWO_DAY_WEDDING]);
    renderWizard(sessionsItemsPath);
    await screen.findByRole('tab', { name: '12/09/2026' });
    openCeremonyCard();
    await addCeremony('Muhurta');
    await selectOption('Event Name', 'Cake Cutting');

    fireEvent.click(screen.getByRole('tab', { name: '13/09/2026' }));
    await waitFor(() => expect(within(itemList()).queryByText('Muhurta')).not.toBeInTheDocument());

    // Submitting immediately after switching (without re-selecting
    // anything) produces a blank row, not a "Cake Cutting" one — proof the
    // entry form itself was actually reset, not just that the list
    // re-filtered to this date.
    submitCeremony();
    expect(await within(itemList()).findByText('(blank ceremony row)')).toBeInTheDocument();
    expect(within(itemList()).queryByText('Cake Cutting')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '12/09/2026' }));
    expect(await within(itemList()).findByText('Muhurta')).toBeInTheDocument();
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
    openCeremonyCard();
    await addCeremony('Muhurta');

    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect(screen.getByText('Accommodation')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next: Sessions & Items →' }));
    expect(await within(itemList()).findByText('Muhurta')).toBeInTheDocument();
  });

  describe('DEV-17 combined list, numbered chips, cost line', () => {
    // The Item cards' text, top to bottom: type label + title + details.
    const rowNames = () =>
      within(itemList())
        .getAllByRole('button', { name: /^(Ceremony|Food\/dining) / })
        .map((row) => row.textContent ?? '');

    const addFood = async (mealName: string, pax = '0', cost = '0') => {
      await selectOption('Meal Name', mealName);
      fireEvent.change(screen.getByLabelText('Pax'), { target: { value: pax } });
      fireEvent.change(screen.getByLabelText('Cost per Plate'), { target: { value: cost } });
      submitFood();
      await within(itemList()).findByText(mealName);
    };

    it('lists ceremonies and food/dining events in one column in add order, latest last, above the buttons and card', async () => {
      seedEventDetails([TWO_DAY_WEDDING]);
      renderWizard(sessionsItemsPath);
      await screen.findByRole('tab', { name: '12/09/2026' });

      openFoodCard();
      await addFood('Breakfast');
      openCeremonyCard();
      await addCeremony('Muhurta');
      openFoodCard();
      await addFood('Lunch');

      const rows = rowNames();
      expect(rows).toHaveLength(3);
      expect(rows[0]).toMatch(/^Food\/diningBreakfast/);
      expect(rows[1]).toMatch(/^CeremonyMuhurta/);
      expect(rows[2]).toMatch(/^Food\/diningLunch/);
      expect(within(itemList()).getByText('Ceremonies & food/dining events · 3')).toBeInTheDocument();

      // List → buttons → open card, in document order.
      const toolbar = screen.getByRole('toolbar', { name: 'Add items' });
      expect(itemList().compareDocumentPosition(toolbar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(toolbar.compareDocumentPosition(foodCard()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('editing an Item keeps its place in the list', async () => {
      seedEventDetails([TWO_DAY_WEDDING]);
      renderWizard(sessionsItemsPath);
      await screen.findByRole('tab', { name: '12/09/2026' });
      openCeremonyCard();
      await addCeremony('Muhurta');
      openFoodCard();
      await addFood('Lunch');

      fireEvent.click(within(itemList()).getByRole('button', { name: /^Ceremony Muhurta/ }));
      await selectOption('Event Name', 'Cake Cutting');
      submitCeremony('Save Ceremony Event');

      await within(itemList()).findByText('Cake Cutting');
      const rows = rowNames();
      expect(rows[0]).toMatch(/^CeremonyCake Cutting/);
      expect(rows[1]).toMatch(/^Food\/diningLunch/);
    });

    it('numbers menu chips in the chip input and on the card, re-numbering when chip 1 is removed', async () => {
      const user = userEvent.setup();
      seedEventDetails([TWO_DAY_WEDDING]);
      renderWizard(sessionsItemsPath);
      await screen.findByRole('tab', { name: '12/09/2026' });
      openFoodCard();
      await selectOption('Meal Name', 'Lunch');

      const menuSearchInput = screen.getByLabelText('Menu items');
      await user.click(menuSearchInput);
      await user.type(menuSearchInput, 'Jalebi');
      fireEvent.click(await screen.findByText('Add "Jalebi" as a new menu item'));
      await user.type(menuSearchInput, 'Paneer');
      fireEvent.click(await screen.findByText('Paneer Tikka'));

      expect(within(foodCard()).getByText('1. Jalebi')).toBeInTheDocument();
      expect(within(foodCard()).getByText('2. Paneer Tikka')).toBeInTheDocument();

      const firstChip = within(foodCard()).getByText('1. Jalebi').closest('.MuiChip-root');
      if (!(firstChip instanceof HTMLElement)) {
        throw new Error('expected the first menu chip');
      }
      fireEvent.click(within(firstChip).getByTestId('CancelIcon'));

      expect(within(foodCard()).getByText('1. Paneer Tikka')).toBeInTheDocument();
      expect(within(foodCard()).queryByText(/Jalebi/)).not.toBeInTheDocument();

      submitFood();
      const menuList = await within(itemList()).findByRole('list', { name: 'Lunch menu items' });
      expect(within(menuList).getByText('1. Paneer Tikka')).toBeInTheDocument();
    });

    it('shows the food cost line as pax × cost per plate = total', async () => {
      seedEventDetails([TWO_DAY_WEDDING]);
      renderWizard(sessionsItemsPath);
      await screen.findByRole('tab', { name: '12/09/2026' });
      openFoodCard();
      await addFood('Lunch', '250', '450');

      expect(within(itemList()).getByText('250 pax × ₹ 450 =')).toHaveTextContent('250 pax × ₹ 450 = ₹ 1,12,500');
    });

    it('bills a limited-seating food event once in its cost line', async () => {
      seedEventDetails([TWO_DAY_WEDDING]);
      renderWizard(sessionsItemsPath);
      await screen.findByRole('tab', { name: '12/09/2026' });
      openFoodCard();
      await selectOption('Meal Name', 'Dinner');
      fireEvent.change(screen.getByLabelText('Pax'), { target: { value: '500' } });
      fireEvent.click(screen.getByLabelText('Limited Seating'));
      fireEvent.change(screen.getByLabelText('Flat Cost'), { target: { value: '450' } });
      submitFood();

      expect(await within(itemList()).findByText('L.S. (500 pax) × ₹ 450 =')).toHaveTextContent(
        'L.S. (500 pax) × ₹ 450 = ₹ 450'
      );
    });
  });
});
