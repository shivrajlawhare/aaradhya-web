import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import { ToastProvider } from '../../src/components/ui/toast-provider';
import UserManagementPage from '../../src/pages/user-management/user-management-page';
import { AuthProvider } from '../../src/stores/auth-context';
import { theme } from '../../src/theme/theme';
import { mockMatchMedia } from '../support/match-media';

interface MockUser {
  id: string;
  name: string;
  username: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const makeUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'user-1',
  name: 'Priya Nair',
  username: 'priya',
  role: 'Reception',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

// A tiny fetch router: GET/POST /users and PATCH /users/:id, backed by an
// in-memory list the test controls, so a refetch after a mutation reflects
// whatever the test set up — no real server involved.
const mockUsersApi = (initialUsers: MockUser[], { deleteStatus = 204 }: { deleteStatus?: number } = {}) => {
  let users = initialUsers;
  const deleteRequests: string[] = [];

  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (method === 'GET' && url.endsWith('/users')) {
        return jsonResponse(200, users);
      }
      if (method === 'POST' && url.endsWith('/users')) {
        const body: Partial<MockUser> = JSON.parse(String(init?.body));
        const created = makeUser({ ...body, id: `user-${users.length + 1}`, active: true });
        users = [...users, created];
        return jsonResponse(201, created);
      }
      if (method === 'PATCH' && url.includes('/users/')) {
        const id = url.split('/users/')[1];
        const body: Partial<MockUser> = JSON.parse(String(init?.body));
        users = users.map((user) => (user.id === id ? { ...user, ...body } : user));
        const updated = users.find((user) => user.id === id);
        return jsonResponse(200, updated);
      }
      if (method === 'DELETE' && url.includes('/users/')) {
        const id = url.split('/users/')[1] ?? '';
        deleteRequests.push(id);
        if (deleteStatus !== 204) {
          return jsonResponse(deleteStatus, {
            error: { code: 'EVENT_MANAGER_NOT_DELETABLE', message: "Event Managers can't be deleted." },
          });
        }
        users = users.filter((user) => user.id !== id);
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      throw new Error(`Unhandled request: ${method} ${url}`);
    })
  );

  return {
    getUsers: () => users,
    deleteRequests,
  };
};

const renderPage = () => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter>
                <UserManagementPage />
              </MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>
  );
};

const fillNewUserForm = ({
  name,
  username,
  password,
  role,
}: {
  name: string;
  username: string;
  password: string;
  role: string;
}) => {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: name } });
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: username } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.mouseDown(screen.getByLabelText('Role'));
  fireEvent.click(screen.getByRole('option', { name: role }));
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('UserManagementPage', () => {
  describe('desktop (>=900px) — UsersTable (STORY-056; D11 role labels)', () => {
    it('lists name, username, role, and active state for every account', async () => {
      mockMatchMedia(true);
      mockUsersApi([
        makeUser({ id: 'user-1', name: 'Priya Nair', username: 'priya', role: 'EventManager', active: true }),
        makeUser({ id: 'user-2', name: 'Arjun Rao', username: 'arjun', role: 'Reception', active: false }),
      ]);
      renderPage();

      const priyaRow = (await screen.findByText('Priya Nair')).closest('tr');
      const arjunRow = screen.getByText('Arjun Rao').closest('tr');
      if (!priyaRow || !arjunRow) {
        throw new Error('expected both rows to render');
      }

      expect(within(priyaRow).getByText('priya')).toBeInTheDocument();
      expect(within(priyaRow).getByText('Active')).toBeInTheDocument();
      expect(within(arjunRow).getByText('arjun')).toBeInTheDocument();
      expect(within(arjunRow).getByText('Inactive')).toBeInTheDocument();
    });

    it('offers exactly the four SRS roles, no free text', async () => {
      mockMatchMedia(true);
      mockUsersApi([]);
      renderPage();
      await waitFor(() => expect(screen.getByLabelText('Name')).toBeInTheDocument());

      fireEvent.mouseDown(screen.getByLabelText('Role'));
      const options = screen.getAllByRole('option');

      expect(options.map((option) => option.textContent)).toEqual([
        'Select a role',
        'Event Manager',
        'F&B Head',
        'Housekeeping',
        'Reception',
      ]);
    });

    it('disables "Create user" until name, username, password, and role are all set', async () => {
      mockMatchMedia(true);
      mockUsersApi([]);
      renderPage();
      await waitFor(() => expect(screen.getByLabelText('Name')).toBeInTheDocument());

      const submit = screen.getByRole('button', { name: 'Create user' });
      expect(submit).toBeDisabled();

      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Hire' } });
      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newhire' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'a-strong-password' } });
      expect(submit).toBeDisabled();

      fireEvent.mouseDown(screen.getByLabelText('Role'));
      fireEvent.click(screen.getByRole('option', { name: 'Reception' }));

      expect(submit).toBeEnabled();
    });

    it('adds the created account to the table without a full page reload', async () => {
      mockMatchMedia(true);
      mockUsersApi([]);
      renderPage();
      await waitFor(() => expect(screen.getByLabelText('Name')).toBeInTheDocument());

      fillNewUserForm({
        name: 'New Hire',
        username: 'newhire',
        password: 'a-strong-password',
        role: 'Reception',
      });
      fireEvent.click(screen.getByRole('button', { name: 'Create user' }));

      // Same render tree throughout (no remount) - `screen` still resolves
      // against the original container, proving this happened client-side.
      expect(await screen.findByText('New Hire')).toBeInTheDocument();
    });

    it('flips a row to Inactive when the deactivate switch is toggled', async () => {
      mockMatchMedia(true);
      mockUsersApi([makeUser({ id: 'user-1', active: true })]);
      renderPage();

      const row = (await screen.findByText('Priya Nair')).closest('tr');
      if (!row) {
        throw new Error('expected a row to render');
      }
      expect(within(row).getByText('Active')).toBeInTheDocument();

      fireEvent.click(within(row).getByRole('switch'));

      await waitFor(() => expect(within(row).getByText('Inactive')).toBeInTheDocument());
    });

    it('updates a row in place when its role is changed', async () => {
      mockMatchMedia(true);
      mockUsersApi([makeUser({ id: 'user-1', role: 'Reception' })]);
      renderPage();
      await screen.findByText('Priya Nair');

      const row = screen.getByText('Priya Nair').closest('tr');
      if (!row) {
        throw new Error('expected a row to render');
      }
      fireEvent.mouseDown(within(row).getByRole('combobox'));
      fireEvent.click(screen.getByRole('option', { name: 'Housekeeping' }));

      await waitFor(() => expect(within(row).getByRole('combobox')).toHaveTextContent('Housekeeping'));
    });
  });

  describe('mobile (<900px) — card list (STORY-056)', () => {
    it('renders name and status on the top row, role below, for every account', async () => {
      mockMatchMedia(false);
      mockUsersApi([
        makeUser({ id: 'user-1', name: 'Priya Nair', role: 'EventManager', active: true }),
        makeUser({ id: 'user-2', name: 'Arjun Rao', role: 'Reception', active: false }),
      ]);
      renderPage();

      const priyaCard = (await screen.findByText('Priya Nair')).closest('.MuiPaper-root') as HTMLElement | null;
      const arjunCard = screen.getByText('Arjun Rao').closest('.MuiPaper-root') as HTMLElement | null;
      if (!priyaCard || !arjunCard) {
        throw new Error('expected both cards to render');
      }

      expect(within(priyaCard).getByText('Active')).toBeInTheDocument();
      expect(within(priyaCard).getByText('Event Manager')).toBeInTheDocument();
      expect(within(arjunCard).getByText('Inactive')).toBeInTheDocument();
      expect(within(arjunCard).getByText('Reception')).toBeInTheDocument();
    });

    it("mutes a deactivated user's whole card, not just its status text", async () => {
      mockMatchMedia(false);
      mockUsersApi([
        makeUser({ id: 'user-1', name: 'Priya Nair', active: true }),
        makeUser({ id: 'user-2', name: 'Arjun Rao', active: false }),
      ]);
      renderPage();

      const activeCard = (await screen.findByText('Priya Nair')).closest('.MuiPaper-root');
      const inactiveCard = screen.getByText('Arjun Rao').closest('.MuiPaper-root');

      expect(activeCard).toHaveStyle({ opacity: '1' });
      expect(inactiveCard).toHaveStyle({ opacity: '0.6' });
    });

    it('does not render the desktop table at all on mobile', async () => {
      mockMatchMedia(false);
      mockUsersApi([makeUser()]);
      renderPage();

      await screen.findByText('Priya Nair');
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('toggles the create-user form open and closed via "Add User", full width', async () => {
      mockMatchMedia(false);
      mockUsersApi([]);
      renderPage();

      const addButton = await screen.findByRole('button', { name: 'Add User' });
      expect(addButton).toHaveClass('MuiButton-fullWidth');
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();

      fireEvent.click(addButton);
      expect(await screen.findByLabelText('Name')).toBeInTheDocument();

      fireEvent.click(addButton);
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    });

    it('closes the form and adds the new card after a successful create', async () => {
      mockMatchMedia(false);
      mockUsersApi([]);
      renderPage();

      fireEvent.click(await screen.findByRole('button', { name: 'Add User' }));
      await waitFor(() => expect(screen.getByLabelText('Name')).toBeInTheDocument());

      fillNewUserForm({
        name: 'New Hire',
        username: 'newhire',
        password: 'a-strong-password',
        role: 'Reception',
      });
      fireEvent.click(screen.getByRole('button', { name: 'Create user' }));

      expect(await screen.findByText('New Hire')).toBeInTheDocument();
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    });
  });
});

describe('UserManagementPage — delete user (DEV-13, D15)', () => {
  const USERS = [
    makeUser({ id: 'user-1', name: 'Priya Nair', username: 'priya', role: 'EventManager' }),
    makeUser({ id: 'user-2', name: 'Kiran More', username: 'kiran', role: 'Reception' }),
  ];
  const BODY =
    'Kiran More will be removed from User Management and will no longer be able to log in. Their past activity stays in the history.';

  it('offers delete only on non-Event Manager rows', async () => {
    mockMatchMedia(true);
    mockUsersApi(USERS);
    renderPage();

    await screen.findByText('Kiran More');
    expect(screen.getByRole('button', { name: 'Delete Kiran More' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Priya Nair' })).not.toBeInTheDocument();
  });

  it('confirms with the 5B.3 copy, and Cancel deletes nothing', async () => {
    mockMatchMedia(true);
    const api = mockUsersApi(USERS);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Delete Kiran More' }));

    const dialog = await screen.findByRole('dialog', { name: 'Delete Kiran More?' });
    expect(within(dialog).getByText(BODY)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Delete user' })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.deleteRequests).toEqual([]);
    expect(screen.getByText('Kiran More')).toBeInTheDocument();
  });

  it('deletes on "Delete user", shows "User deleted." and drops the row', async () => {
    mockMatchMedia(true);
    const api = mockUsersApi(USERS);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Delete Kiran More' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete user' }));

    expect(await screen.findByText('User deleted.')).toBeInTheDocument();
    expect(api.deleteRequests).toEqual(['user-2']);
    await waitFor(() => expect(screen.queryByText('Kiran More')).not.toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the API’s reason when the delete is refused', async () => {
    mockMatchMedia(true);
    mockUsersApi(USERS, { deleteStatus: 400 });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Delete Kiran More' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete user' }));

    expect(await screen.findByText("Event Managers can't be deleted.")).toBeInTheDocument();
    expect(screen.getByText('Kiran More')).toBeInTheDocument();
  });

  it('puts delete in the card controls on mobile (non-EM only) and opens the bottom sheet', async () => {
    mockMatchMedia(false);
    const api = mockUsersApi(USERS);
    renderPage();

    const cards = within(await screen.findByRole('list', { name: 'Users' })).getAllByRole('listitem');
    expect(within(cards[0]!).queryByRole('button', { name: /^Delete/ })).not.toBeInTheDocument();
    fireEvent.click(within(cards[1]!).getByRole('button', { name: 'Delete Kiran More' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete user' }));

    expect(await screen.findByText('User deleted.')).toBeInTheDocument();
    expect(api.deleteRequests).toEqual(['user-2']);
  });

  it('shows friendly role labels in the table selects (D11)', async () => {
    mockMatchMedia(true);
    mockUsersApi(USERS);
    renderPage();

    expect(await screen.findByRole('combobox', { name: 'Role for Priya Nair' })).toHaveTextContent('Event Manager');
    expect(screen.getByRole('combobox', { name: 'Role for Kiran More' })).toHaveTextContent('Reception');
  });
});
