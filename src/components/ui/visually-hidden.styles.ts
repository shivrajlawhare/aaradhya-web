import type { SxProps, Theme } from '@mui/material';

// Present for screen readers only — e.g. a loading status announced while
// skeletons stand in for content.
export const visuallyHiddenStyles: SxProps<Theme> = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  p: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};
