import { initTsrReactQuery } from '@ts-rest/react-query/v5';
import { contract } from '../contract';
import { readStoredSession } from '../stores/auth-context';

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Read fresh per request (not captured once at module load) so a login,
// logout, or self-deactivation is picked up on the very next call.
const authorizationHeader = (): string => {
  const { token } = readStoredSession();
  return token ? `Bearer ${token}` : '';
};

// Typed hooks for every route in src/contract — e.g. tsr.login.useMutation().
// Never hand-write a fetch/axios call for anything the contract covers.
export const tsr = initTsrReactQuery(contract, {
  baseUrl,
  baseHeaders: {
    authorization: authorizationHeader,
  },
});
