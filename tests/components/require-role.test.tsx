import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import RequireRole from '../../src/components/ui/require-role';
import { Role } from '../../src/contract';
import { AuthProvider, SESSION_STORAGE_KEY } from '../../src/stores/auth-context';

const GUARDED_PATH = '/guarded';
const LOGIN_PATH = '/login';
const DASHBOARD_PATH = '/dashboard';

const seedSession = (role: Role) => {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ token: 'a-token', user: { id: 'user-1', name: 'Someone', role } })
  );
};

const renderGuarded = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[GUARDED_PATH]}>
        <Routes>
          <Route path={LOGIN_PATH} element={<div>login screen</div>} />
          <Route path={DASHBOARD_PATH} element={<div>dashboard placeholder</div>} />
          <Route
            path={GUARDED_PATH}
            element={
              <RequireRole roles={[Role.EventManager]}>
                <div>guarded content</div>
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

afterEach(() => {
  localStorage.clear();
});

describe('RequireRole', () => {
  it('redirects to login when there is no session', () => {
    renderGuarded();

    expect(screen.getByText('login screen')).toBeInTheDocument();
    expect(screen.queryByText('guarded content')).not.toBeInTheDocument();
  });

  it('redirects to the dashboard when the session role is not in the allow-list', () => {
    seedSession(Role.Reception);

    renderGuarded();

    expect(screen.getByText('dashboard placeholder')).toBeInTheDocument();
    expect(screen.queryByText('guarded content')).not.toBeInTheDocument();
  });

  it('renders the guarded content for an allowed role', () => {
    seedSession(Role.EventManager);

    renderGuarded();

    expect(screen.getByText('guarded content')).toBeInTheDocument();
  });
});
