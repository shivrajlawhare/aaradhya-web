import type { SxProps, Theme } from '@mui/material';
import { motionTokens, paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke, iconSize } = scaleTokens;

export type StepStatus = 'current' | 'completed' | 'upcoming';

// Figma Wizard/Stepper Desktop: marker + label per step, joined by
// connectors that turn orange once passed.
export const desktopRowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[12]}px`,
};

export const stepStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[8]}px`,
  flexShrink: 0,
};

const MARKER_SIZE = 24;

// Figma Wizard/Step: Current = orange disc with the strong outline;
// Completed = inverse disc with a check; Upcoming = outlined number.
export const markerStyles = (status: StepStatus): SxProps<Theme> => {
  const base = {
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: '50%',
    typography: 'labelM',
    '& svg': { fontSize: iconSize.s },
  };
  if (status === 'current') {
    return {
      ...base,
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
      border: `${stroke.default}px solid ${paletteVar('brand-borderStrong')}`,
    };
  }
  if (status === 'completed') {
    return {
      ...base,
      bgcolor: paletteVar('brand-inverse'),
      color: paletteVar('brand-onInverse'),
      border: `${stroke.default}px solid ${paletteVar('brand-inverse')}`,
    };
  }
  return {
    ...base,
    bgcolor: 'transparent',
    color: 'text.secondary',
    border: `${stroke.default}px solid ${paletteVar('brand-borderHover')}`,
  };
};

export const labelStyles = (status: StepStatus): SxProps<Theme> => ({
  typography: status === 'current' ? 'labelL' : 'bodyS',
  color: status === 'upcoming' ? 'text.secondary' : 'text.primary',
  whiteSpace: 'nowrap',
});

// Figma Motion Spec "Wizard stepper — progress": the divider track with a
// primary fill that grows from the left (scaleX 0 → 1, motion/slow) as the
// step is passed. A transform, so the row never shifts.
export const connectorStyles = (isPassed: boolean): SxProps<Theme> => ({
  position: 'relative',
  flex: 1,
  minWidth: space[16],
  height: stroke.default,
  borderRadius: `${radius.pill}px`,
  bgcolor: 'divider',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    bgcolor: 'primary.main',
    transformOrigin: 'left',
    transform: isPassed ? 'scaleX(1)' : 'scaleX(0)',
    transition: `transform ${motionTokens.duration.slow}ms ${motionTokens.easing.slow}`,
  },
});

// Figma Wizard/Stepper Mobile: "Step N of 5 — <label>" over a 5-segment bar.
export const mobileWrapperStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[8]}px`,
  width: '100%',
};

export const mobileLabelStyles: SxProps<Theme> = {
  color: 'text.primary',
};

export const segmentRowStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: `${space[4]}px`,
};

const SEGMENT_HEIGHT = 6;

export const segmentStyles = (isFilled: boolean): SxProps<Theme> => ({
  height: SEGMENT_HEIGHT,
  borderRadius: `${radius.pill}px`,
  bgcolor: isFilled ? 'primary.main' : 'divider',
  transition: `background-color ${motionTokens.duration.slow}ms ${motionTokens.easing.slow}`,
});

// The visible step name is painted from `data-label`: the DOM text is the
// visually hidden "N. Label" beside it, so the name isn't in the DOM twice.
export const visibleLabelStyles: SxProps<Theme> = {
  '&::before': { content: 'attr(data-label)' },
};
