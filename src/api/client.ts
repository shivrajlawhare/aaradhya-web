import { initTsrReactQuery } from '@ts-rest/react-query/v5';
import { contract } from '../contract';

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Typed hooks for every route in src/contract — e.g. tsr.login.useMutation().
// Never hand-write a fetch/axios call for anything the contract covers.
export const tsr = initTsrReactQuery(contract, {
  baseUrl,
  baseHeaders: {},
});
