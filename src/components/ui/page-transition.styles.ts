import type { SxProps, Theme } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { motionTokens } from '../../theme/tokens';

// Opacity and transform only, so nothing around the content moves (no
// layout shift). No fill-mode: once finished the transform is gone, so
// fixed / sticky children position against the viewport as usual.
const routeEnter = keyframes`
  from { opacity: 0; transform: translateY(${motionTokens.travel}px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const pageTransitionStyles = (isReducedMotion: boolean): SxProps<Theme> => ({
  animation: isReducedMotion ? 'none' : `${routeEnter} ${motionTokens.duration.slow}ms ${motionTokens.easing.slow}`,
});
