import type { SxProps, Theme } from '@mui/material';
import { motionTokens, paletteVar, scaleTokens } from '../../theme/tokens';
import { navFocusRing } from './app-shell-nav.styles';

const { radius, space, controlSize } = scaleTokens;

const SEGMENT_WIDTH = 80;
const SEGMENT_HEIGHT = controlSize.s;
const TRACK_PADDING = space[4];

export const toggleTrackStyles: SxProps<Theme> = {
  position: 'relative',
  display: 'inline-flex',
  alignSelf: 'flex-start',
  gap: `${TRACK_PADDING}px`,
  p: `${TRACK_PADDING}px`,
  borderRadius: `${radius.pill}px`,
  bgcolor: paletteVar('nav-hover'),
};

// The selected segment's pill, sliding under the two labels.
export const toggleKnobStyles = (isDark: boolean): SxProps<Theme> => ({
  position: 'absolute',
  top: TRACK_PADDING,
  left: TRACK_PADDING,
  width: SEGMENT_WIDTH,
  height: SEGMENT_HEIGHT,
  borderRadius: `${radius.pill}px`,
  bgcolor: paletteVar('nav-text'),
  transform: isDark ? `translateX(${SEGMENT_WIDTH + TRACK_PADDING}px)` : 'translateX(0)',
  transition: `transform ${motionTokens.duration.base}ms ${motionTokens.easing.base}`,
});

export const toggleSegmentStyles = (isSelected: boolean): SxProps<Theme> => ({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  width: SEGMENT_WIDTH,
  height: SEGMENT_HEIGHT,
  borderRadius: `${radius.pill}px`,
  color: isSelected ? paletteVar('nav-activeText') : paletteVar('nav-textMuted'),
  transition: `color ${motionTokens.duration.base}ms ${motionTokens.easing.base}`,
  '& svg': { fontSize: 16 },
  '&.Mui-focusVisible': navFocusRing,
});
