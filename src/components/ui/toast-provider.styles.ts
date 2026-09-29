import type { SxProps, Theme } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { motionTokens, paletteVar, scaleTokens, shadowTokens } from '../../theme/tokens';

const { radius, space, iconSize } = scaleTokens;

export type ToastSeverity = 'success' | 'error';

const TOAST_MAX_WIDTH = 360;
const TOAST_MIN_HEIGHT = 48;
const ACCENT_BAR_WIDTH = 4;
const ACCENT_BAR_HEIGHT = 32;
const TRAVEL = space[16];

// Bottom-right 24 px on desktop; bottom-centre 16 px on mobile.
export const toastStackStyles: SxProps<Theme> = {
  position: 'fixed',
  bottom: { xs: space[16], md: space[24] },
  right: { xs: 'auto', md: space[24] },
  left: { xs: '50%', md: 'auto' },
  transform: { xs: 'translateX(-50%)', md: 'none' },
  zIndex: (theme) => theme.zIndex.snackbar,
  gap: `${space[8]}px`,
  width: { xs: `calc(100% - ${space[32]}px)`, md: '100%' },
  maxWidth: TOAST_MAX_WIDTH,
};

const toastEnter = keyframes`
  from { opacity: 0; transform: translateY(${TRAVEL}px); }
  to { opacity: 1; transform: translateY(0); }
`;

const toastExit = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(${TRAVEL}px); }
`;

// The accent bar and icon carry the severity; the surface is always the
// inverse one (espresso in light mode, custard in dark) so a toast pops
// against either page background.
const SEVERITY_ACCENT: Record<ToastSeverity, string> = {
  success: 'success.main',
  error: 'error.main',
};

export const EXIT_DURATION_MS = motionTokens.duration.base;

export const toastStyles = (severity: ToastSeverity, isLeaving: boolean): SxProps<Theme> => ({
  alignItems: 'center',
  gap: `${space[12]}px`,
  minHeight: TOAST_MIN_HEIGHT,
  py: `${space[8]}px`,
  pl: 0,
  pr: `${space[8]}px`,
  bgcolor: paletteVar('brand-inverse'),
  color: paletteVar('brand-onInverse'),
  borderRadius: `${radius.md}px`,
  boxShadow: shadowTokens.softLg,
  typography: 'bodyM',
  animation: isLeaving
    ? `${toastExit} ${EXIT_DURATION_MS}ms ${motionTokens.easing.base} forwards`
    : `${toastEnter} ${motionTokens.duration.spring}ms ${motionTokens.easing.spring}`,
  '&::before': {
    content: '""',
    flexShrink: 0,
    width: ACCENT_BAR_WIDTH,
    height: ACCENT_BAR_HEIGHT,
    borderRadius: `0 ${radius.xs}px ${radius.xs}px 0`,
    bgcolor: SEVERITY_ACCENT[severity],
  },
  '& .MuiAlert-icon': {
    m: 0,
    p: 0,
    opacity: 1,
    fontSize: iconSize.m,
    color: SEVERITY_ACCENT[severity],
  },
  '& .MuiAlert-message': {
    flex: 1,
    p: 0,
    overflowWrap: 'anywhere',
  },
  '& .MuiAlert-action': {
    m: 0,
    p: 0,
  },
  '& .MuiAlert-action .MuiIconButton-root': {
    color: 'inherit',
  },
});
