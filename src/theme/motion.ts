import { useMediaQuery } from '@mui/material';

// The one reduced-motion query every motion decision reads (Figma Motion
// Spec: under it, state changes are instant, loaders static, and count-up
// shows the final number).
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const useReducedMotion = (): boolean => useMediaQuery(REDUCED_MOTION_QUERY, { noSsr: true });
