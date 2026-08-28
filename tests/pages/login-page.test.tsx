import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import LoginPage from '../../src/pages/login/login-page';
import { DASHBOARD_PATH, LOGIN_PATH } from '../../src/routes';
import { AuthProvider } from '../../src/stores/auth-context';
import { theme } from '../../src/theme/theme';

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  );

const renderLoginPage = () => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <MemoryRouter initialEntries={[LOGIN_PATH]}>
              <Routes>
                <Route path={LOGIN_PATH} element={<LoginPage />} />
                <Route path={DASHBOARD_PATH} element={<div>dashboard placeholder</div>} />
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>,
  );
};

const fillForm = (username: string, password: string) => {
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: username } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('LoginPage', () => {
  it('disables submit until both fields have a value', () => {
    renderLoginPage();
    const submit = screen.getByRole('button', { name: 'Log in' });

    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'priya' } });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    expect(submit).toBeEnabled();
  });

  it('masks the password field', () => {
    renderLoginPage();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('shows one inline error for a 401, without naming which field was wrong', async () => {
    vi.mocked(fetch).mockReturnValue(
      jsonResponse(401, {
        error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect username or password.' },
      }),
    );
    renderLoginPage();
    fillForm('priya', 'wrong-password');

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent('Incorrect username or password.');
  });

  it('stores the token and navigates away on a successful login', async () => {
    vi.mocked(fetch).mockReturnValue(
      jsonResponse(200, {
        token: 'signed-jwt',
        user: { id: 'user-1', name: 'Priya Nair', role: 'EventManager' },
      }),
    );
    renderLoginPage();
    fillForm('priya', 'correct-password');

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await screen.findByText('dashboard placeholder');
    const stored = localStorage.getItem('aaradhya.session');
    expect(stored).toContain('signed-jwt');
  });

  it('submits on Enter without clicking the button', async () => {
    vi.mocked(fetch).mockReturnValue(
      jsonResponse(200, {
        token: 'signed-jwt',
        user: { id: 'user-1', name: 'Priya Nair', role: 'EventManager' },
      }),
    );
    renderLoginPage();
    fillForm('priya', 'correct-password');

    const form = screen.getByLabelText('Password').closest('form');
    if (!form) {
      throw new Error('form not found');
    }
    fireEvent.submit(form);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it('disables the button while a login request is in flight', async () => {
    let resolveFetch: (value: Response) => void = () => {};
    vi.mocked(fetch).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    renderLoginPage();
    fillForm('priya', 'correct-password');

    const submit = screen.getByRole('button', { name: 'Log in' });
    fireEvent.click(submit);

    await waitFor(() => expect(submit).toBeDisabled());

    resolveFetch(
      await jsonResponse(200, {
        token: 'signed-jwt',
        user: { id: 'user-1', name: 'Priya Nair', role: 'EventManager' },
      }),
    );
  });

  it('logs no console errors on load or on the error path', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fetch).mockReturnValue(
      jsonResponse(401, {
        error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect username or password.' },
      }),
    );

    renderLoginPage();
    fillForm('priya', 'wrong-password');
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await screen.findByText('Incorrect username or password.');

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
