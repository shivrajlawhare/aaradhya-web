import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import { AuthProvider, SESSION_STORAGE_KEY } from '../../src/stores/auth-context';
import { theme } from '../../src/theme/theme';
import EventCreationPage from '../../src/pages/event-creation/event-creation-page';
import { EVENT_CREATE_PATH, EVENT_DETAIL_PATH_PATTERN, eventDetailPath } from '../../src/routes';

const CURRENT_USER = { id: 'manager-1', name: 'Priya Nair', role: 'EventManager' };

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  );

const seedSession = () => {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ token: 'signed-jwt', user: CURRENT_USER }),
  );
};

interface MockManager {
  id: string;
  name: string;
  username: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const makeManager = (overrides: Partial<MockManager> = {}): MockManager => ({
  id: 'manager-1',
  name: 'Priya Nair',
  username: 'priya',
  role: 'EventManager',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

// Mocks GET /users (event manager picker) and POST /events (submit). Every
// POST body the app actually sent is captured on `createRequests` so tests
// can assert on the payload shape, not just the resulting UI.
const mockEventsApi = ({
  managers = [makeManager()],
  createResponse,
}: {
  managers?: MockManager[];
  createResponse?: (body: Record<string, unknown>) => Promise<Response>;
}) => {
  const createRequests: Record<string, unknown>[] = [];

  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (method === 'GET' && url.endsWith('/users')) {
        return jsonResponse(200, managers);
      }
      if (method === 'POST' && url.endsWith('/events')) {
        const body: Record<string, unknown> = JSON.parse(String(init?.body));
        createRequests.push(body);
        if (createResponse) {
          return createResponse(body);
        }
        return jsonResponse(201, {
          id: 'event-1',
          eventId: 'ARD-EVT-2026-001',
          eventFamilyType: body.eventFamilyType,
          status: 'Tentative',
          eventManager: body.eventManager,
          clientContacts: body.clientContacts,
          createdBy: CURRENT_USER.id,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        });
      }
      throw new Error(`Unhandled request: ${method} ${url}`);
    }),
  );

  return { createRequests };
};

const renderPage = () => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <MemoryRouter initialEntries={[EVENT_CREATE_PATH]}>
              <Routes>
                <Route path={EVENT_CREATE_PATH} element={<EventCreationPage />} />
                <Route path={EVENT_DETAIL_PATH_PATTERN} element={<div>event detail placeholder</div>} />
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>,
  );
};

const fillContactName = (rowIndex: number, name: string) => {
  const nameFields = screen.getAllByLabelText('Name');
  const field = nameFields[rowIndex];
  if (!field) {
    throw new Error(`expected a Name field at row ${rowIndex}`);
  }
  fireEvent.change(field, { target: { value: name } });
};

const clickRemoveRow = (rowIndex: number) => {
  const removeButtons = screen.getAllByRole('button', { name: /Remove contact row/ });
  const button = removeButtons[rowIndex];
  if (!button) {
    throw new Error(`expected a remove button at row ${rowIndex}`);
  }
  fireEvent.click(button);
};

beforeEach(() => {
  seedSession();
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('EventCreationPage', () => {
  it('renders three default Client Contact rows (Bride/Groom/POC)', async () => {
    mockEventsApi({});
    renderPage();

    await waitFor(() => expect(screen.getAllByLabelText('Name')).toHaveLength(3));
    const roleSelects = screen.getAllByRole('combobox', { name: 'Role' });
    expect(roleSelects.map((select) => select.textContent)).toEqual(['Bride', 'Groom', 'POC']);
  });

  it('disables submit until at least one Client Contact row has a non-empty name', async () => {
    mockEventsApi({});
    renderPage();
    await waitFor(() => expect(screen.getAllByLabelText('Name')).toHaveLength(3));

    const submit = screen.getByRole('button', { name: 'Create event' });
    expect(submit).toBeDisabled();

    fillContactName(0, 'Priya Nair');

    expect(submit).toBeEnabled();
  });

  it('shows a free-text field only when "Custom…" family type is selected', async () => {
    mockEventsApi({});
    renderPage();
    const familyTypeSelect = await screen.findByRole('combobox', { name: 'Family type' });

    expect(screen.queryByLabelText('Custom family type')).not.toBeInTheDocument();

    fireEvent.mouseDown(familyTypeSelect);
    fireEvent.click(screen.getByRole('option', { name: 'Custom…' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());

    expect(screen.getByLabelText('Custom family type')).toBeInTheDocument();

    fireEvent.mouseDown(familyTypeSelect);
    fireEvent.click(screen.getByRole('option', { name: 'Wedding' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());

    expect(screen.queryByLabelText('Custom family type')).not.toBeInTheDocument();
  });

  it('defaults the event manager picker to the current user, listing only active Event Managers', async () => {
    mockEventsApi({
      managers: [
        makeManager({ id: 'manager-1', name: 'Priya Nair' }),
        makeManager({ id: 'manager-2', name: 'Arjun Rao' }),
        makeManager({ id: 'manager-3', name: 'Deactivated Manager', active: false }),
        makeManager({ id: 'not-a-manager', name: 'Some FnB Head', role: 'FnBHead' }),
      ],
    });
    renderPage();
    const eventManagerSelect = await screen.findByRole('combobox', { name: 'Event manager' });
    await waitFor(() => expect(eventManagerSelect).toHaveTextContent('Priya Nair (you)'));

    fireEvent.mouseDown(eventManagerSelect);
    const options = screen.getAllByRole('option');

    expect(options.map((option) => option.textContent)).toEqual(['Priya Nair (you)', 'Arjun Rao']);
  });

  it('navigates to the new Event detail screen on a successful submit', async () => {
    mockEventsApi({});
    renderPage();
    await waitFor(() => expect(screen.getAllByLabelText('Name')).toHaveLength(3));

    fillContactName(0, 'Priya Nair');
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }));

    await screen.findByText('event detail placeholder');
  });

  it('shows a 400 from the server as an inline form error, not a silent failure', async () => {
    mockEventsApi({
      createResponse: () =>
        jsonResponse(400, {
          error: { code: 'VALIDATION_ERROR', message: 'clientContacts: at least one row is required.' },
        }),
    });
    renderPage();
    await waitFor(() => expect(screen.getAllByLabelText('Name')).toHaveLength(3));

    fillContactName(0, 'Priya Nair');
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'clientContacts: at least one row is required.',
    );
    expect(screen.queryByText('event detail placeholder')).not.toBeInTheDocument();
  });

  it('does not submit a row that was removed, even if it had unsaved text', async () => {
    const { createRequests } = mockEventsApi({});
    renderPage();
    await waitFor(() => expect(screen.getAllByLabelText('Name')).toHaveLength(3));

    fillContactName(0, 'Priya Nair');
    fillContactName(1, 'Rohan Nair');
    clickRemoveRow(1);

    await waitFor(() => expect(screen.getAllByLabelText('Name')).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }));

    await waitFor(() => expect(createRequests).toHaveLength(1));
    const contacts = createRequests[0]?.clientContacts as { name: string }[];
    expect(contacts.map((contact) => contact.name)).toEqual(['Priya Nair']);
  });

  it('excludes a still-blank default row from the submitted payload', async () => {
    const { createRequests } = mockEventsApi({});
    renderPage();
    await waitFor(() => expect(screen.getAllByLabelText('Name')).toHaveLength(3));

    // Only the Bride row is filled in — Groom and POC stay blank defaults.
    fillContactName(0, 'Priya Nair');
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }));

    await waitFor(() => expect(createRequests).toHaveLength(1));
    const contacts = createRequests[0]?.clientContacts as { name: string }[];
    expect(contacts).toHaveLength(1);
    expect(contacts[0]?.name).toBe('Priya Nair');
  });

  // STORY-057's own root-cause regression: useFieldArray's `update()` handed
  // back a new `field.id` on every call, which ClientContactRows used as its
  // row's React key — so every keystroke remounted the row's TextField and
  // dropped focus. A single fireEvent.change with the whole final string
  // wouldn't catch this (the remount only shows up across multiple change
  // events on the same node) — types character-by-character instead, and
  // fails the moment a remount silently detaches the field from the
  // document, the same way real per-keystroke typing would.
  it('keeps focus on a Client Contact Name field across every keystroke, not just the final value', async () => {
    mockEventsApi({});
    renderPage();
    await waitFor(() => expect(screen.getAllByLabelText('Name')).toHaveLength(3));

    const nameField = screen.getAllByLabelText('Name')[0] as HTMLInputElement;
    nameField.focus();
    expect(document.activeElement).toBe(nameField);

    let typed = '';
    for (const char of 'Priya Nair') {
      typed += char;
      fireEvent.change(nameField, { target: { value: typed } });
      expect(document.activeElement).toBe(nameField);
    }
    expect(nameField).toHaveValue('Priya Nair');
  });

  it('keeps row identity and order correct under rapid add/remove', async () => {
    const { createRequests } = mockEventsApi({});
    renderPage();
    await waitFor(() => expect(screen.getAllByLabelText('Name')).toHaveLength(3));

    fireEvent.click(screen.getByRole('button', { name: 'Add contact' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add contact' }));
    await waitFor(() => expect(screen.getAllByLabelText('Name')).toHaveLength(5));

    fillContactName(0, 'Priya Nair');
    fillContactName(3, 'Fourth Row');
    fillContactName(4, 'Fifth Row');
    // Remove the second default row (Groom, index 1) and the first added
    // row (index 3, "Fourth Row") in quick succession.
    clickRemoveRow(3);
    clickRemoveRow(1);

    await waitFor(() => expect(screen.getAllByLabelText('Name')).toHaveLength(3));
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }));

    await waitFor(() => expect(createRequests).toHaveLength(1));
    const contacts = createRequests[0]?.clientContacts as { name: string }[];
    expect(contacts.map((contact) => contact.name)).toEqual(['Priya Nair', 'Fifth Row']);
  });
});
