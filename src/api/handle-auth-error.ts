import { LOGIN_PATH } from '../routes';
import { SESSION_STORAGE_KEY } from '../stores/auth-context';

const isUnauthenticatedError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'status' in error && error.status === 401;

/**
 * Wired into QueryClient's queryCache/mutationCache (src/main.tsx). A 401 from
 * any authenticated call means the session just died server-side (expired,
 * or — the case this exists for — the logged-in account was just
 * deactivated/demoted, possibly by itself: STORY-006/007). The
 * localStorage.getItem guard leaves the login page's own inline-error UX
 * alone — its 401s happen with no stored session, so this never fires there.
 */
export const handleAuthError = (error: unknown): void => {
  if (isUnauthenticatedError(error) && localStorage.getItem(SESSION_STORAGE_KEY)) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.location.assign(LOGIN_PATH);
  }
};
