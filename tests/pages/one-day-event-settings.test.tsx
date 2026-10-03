import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import { ToastProvider } from '../../src/components/ui/toast-provider';
import SettingsPage from '../../src/pages/settings/settings-page';
import { AuthProvider } from '../../src/stores/auth-context';
import { theme } from '../../src/theme/theme';
import { EXAMPLE_4_ROOM_TYPES, EXAMPLE_4_TEMPLATE, EXAMPLE_4_VENUES } from '../support/example-quotation-4';
import { mockMatchMedia } from '../support/match-media';

const NOW = '2026-01-01T00:00:00.000Z';

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

const MENU_ITEMS = EXAMPLE_4_TEMPLATE.meals
  .flatMap((meal) => meal.menuItems)
  .map((menuItem) => ({ ...menuItem, defaultCostPerPlate: 0, createdAt: NOW, updatedAt: NOW }));

const EVENT_TYPES = ['Wedding', 'Haldi'].map((name, index) => ({
  id: `et-${index}`,
  name,
  active: true,
  createdAt: NOW,
  updatedAt: NOW,
}));

let lastPutBody: Record<string, unknown> | undefined;

const mockApi = () => {
  lastPutBody = undefined;
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (url.includes('/settings/one-day-event-template')) {
        if (method === 'PUT') {
          lastPutBody = JSON.parse(String(init?.body));
          return jsonResponse(200, { ...EXAMPLE_4_TEMPLATE, session: { ...EXAMPLE_4_TEMPLATE.session, pax: 600 } });
        }
        return jsonResponse(200, EXAMPLE_4_TEMPLATE);
      }
      if (url.includes('/venues')) {
        return jsonResponse(200, EXAMPLE_4_VENUES);
      }
      if (url.includes('/event-types')) {
        return jsonResponse(200, EVENT_TYPES);
      }
      if (url.includes('/room-types')) {
        return jsonResponse(200, EXAMPLE_4_ROOM_TYPES);
      }
      if (url.includes('/menu-items')) {
        return jsonResponse(200, MENU_ITEMS);
      }
      throw new Error(`Unhandled request: ${method} ${url}`);
    })
  );
};

const renderSettings = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter>
                <SettingsPage />
              </MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>
  );

const openOneDayEventSection = async () => {
  const nav = await screen.findByRole('navigation', { name: 'Settings sections' });
  fireEvent.click(within(nav).getByRole('button', { name: 'One Day Event' }));
  return screen.findByRole('form', { name: 'One Day Event template' });
};

beforeEach(() => {
  mockMatchMedia(true);
  mockApi();
});

afterEach(() => {
  vi.unstubAllGlobals();
  mockMatchMedia(false);
});

describe('Settings — One Day Event (DEV-11)', () => {
  it('is the 5th section, showing the seeded template with master occupancy and tariffs', async () => {
    renderSettings();

    const nav = await screen.findByRole('navigation', { name: 'Settings sections' });
    expect(
      within(nav)
        .getAllByRole('button')
        .map((button) => button.textContent)
    ).toEqual(['Venues', 'Event Types', 'Room Types', 'Menu Items', 'One Day Event']);

    const form = await openOneDayEventSection();
    expect(within(form).getByRole('combobox', { name: 'Event type' })).toHaveTextContent('Wedding');
    expect(within(form).getByRole('combobox', { name: 'Venue' })).toHaveTextContent('Full Banquet');
    // Unset in the template → the Venues master's cost.
    expect(within(form).getByLabelText('Venue Cost')).toHaveValue(120000);
    expect(within(form).getByLabelText('Delux rooms')).toHaveValue(14);
    const rooms = within(form).getByRole('table', { name: 'Template rooms' });
    expect(within(rooms).getByText('2,800')).toBeInTheDocument();
    expect(within(form).getByRole('group', { name: 'Meal 2' })).toHaveTextContent('Kokam Sarbat');
    expect(within(form).getByDisplayValue('wedding + punyawachan')).toBeInTheDocument();
    expect(within(form).getByRole('button', { name: 'Save template' })).toBeDisabled();
  });

  it('saves an edit as the whole template and confirms with the toast', async () => {
    renderSettings();
    const form = await openOneDayEventSection();

    fireEvent.change(within(form).getAllByLabelText('Pax')[0]!, { target: { value: '600' } });
    const save = within(form).getByRole('button', { name: 'Save template' });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);

    expect(await screen.findByText('One Day Event template saved.')).toBeInTheDocument();
    expect(lastPutBody).toMatchObject({
      eventFamilyType: 'Wedding',
      session: { sessionType: 'Wedding', venue: 'Full Banquet', startTime: '09:00', endTime: '15:00', pax: 600 },
      roomLines: [
        { roomType: 'Delux', noOfRooms: 14 },
        { roomType: 'Executive', noOfRooms: 2 },
        { roomType: 'Extra Beds', noOfRooms: 0 },
        { roomType: 'Family Room', noOfRooms: 2 },
      ],
      ceremonies: [{ eventName: 'Muhurta', startTime: '11:00', endTime: '12:30' }],
      lineItems: [
        { name: 'Decoration', amount: 115000 },
        { name: 'Photographer', amount: 0 },
        { name: 'Bhatji', note: 'wedding + punyawachan', amount: 7000 },
      ],
      gstPercent: 5,
    });
    // The master's own cost stays unset, so a Venues master edit still reaches the prefill.
    expect(lastPutBody?.session).not.toHaveProperty('venueCost');
    const meals = lastPutBody?.meals as { menuItems: string[] }[];
    expect(meals[0]?.menuItems).toEqual(['mi-0', 'mi-1', 'mi-2', 'mi-3']);
    await waitFor(() => expect(within(form).getByRole('button', { name: 'Save template' })).toBeDisabled());
  });

  it('fills the venue cost from the master on a venue change, and saves a changed cost as an override', async () => {
    renderSettings();
    const form = await openOneDayEventSection();

    fireEvent.mouseDown(within(form).getByRole('combobox', { name: 'Venue' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Poolside' }));
    expect(within(form).getByLabelText('Venue Cost')).toHaveValue(60000);

    fireEvent.change(within(form).getByLabelText('Venue Cost'), { target: { value: '55000' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Save template' }));

    await screen.findByText('One Day Event template saved.');
    expect(lastPutBody?.session).toMatchObject({ venue: 'Poolside', venueCost: 55000 });
  });

  it('removes and adds rows', async () => {
    renderSettings();
    const form = await openOneDayEventSection();

    fireEvent.click(within(form).getByRole('button', { name: 'Remove ceremony event 1' }));
    fireEvent.click(within(form).getByRole('button', { name: 'Add line item' }));
    fireEvent.change(within(within(form).getByRole('group', { name: 'Line item 4' })).getByLabelText('Name'), {
      target: { value: 'Mehendi artist' },
    });
    fireEvent.click(within(form).getByRole('button', { name: 'Save template' }));

    await screen.findByText('One Day Event template saved.');
    expect(lastPutBody?.ceremonies).toEqual([]);
    expect(lastPutBody?.lineItems).toHaveLength(4);
  });

  it('offers One Day Event as a chip on mobile', async () => {
    mockMatchMedia(false);
    renderSettings();

    const chips = await screen.findByRole('tablist', { name: 'Settings sections' });
    fireEvent.click(within(chips).getByRole('tab', { name: 'One Day Event' }));

    expect(await screen.findByRole('form', { name: 'One Day Event template' })).toBeInTheDocument();
  });
});

describe('Settings — One Day Event line items copy (DEV-18)', () => {
  it('labels the line-item amount "Total Cost", never "Total Cost with GST"', async () => {
    renderSettings();
    const form = await openOneDayEventSection();

    expect(within(form).queryByText(/Total Cost with GST/)).not.toBeInTheDocument();
    expect(within(form).getAllByLabelText('Total Cost').length).toBeGreaterThan(0);
  });
});
