import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleAuthError } from '../../src/api/handle-auth-error';
import { SESSION_STORAGE_KEY } from '../../src/stores/auth-context';

const seedSession = () => {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ token: 'a-token', user: { id: 'user-1', name: 'Priya Nair', role: 'EventManager' } }),
  );
};

const stubLocationAssign = () => {
  const assign = vi.fn();
  vi.stubGlobal('location', { ...window.location, assign });
  return assign;
};

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('handleAuthError', () => {
  it('clears the session and redirects to login on a 401 while a session exists', () => {
    seedSession();
    const assign = stubLocationAssign();

    handleAuthError({ status: 401, body: { error: { code: 'UNAUTHENTICATED' } } });

    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login');
  });

  it('does nothing for a 401 with no stored session (e.g. a failed login attempt)', () => {
    const assign = stubLocationAssign();

    handleAuthError({ status: 401, body: {} });

    expect(assign).not.toHaveBeenCalled();
  });

  it('does nothing for a non-401 error', () => {
    seedSession();
    const assign = stubLocationAssign();

    handleAuthError({ status: 409, body: {} });

    expect(assign).not.toHaveBeenCalled();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull();
  });

  it('does nothing for a network-level Error', () => {
    seedSession();
    const assign = stubLocationAssign();

    handleAuthError(new Error('network down'));

    expect(assign).not.toHaveBeenCalled();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull();
  });
});
