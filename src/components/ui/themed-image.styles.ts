import type { SxProps, Theme } from '@mui/material';

// Both colour-scheme renders sit in the DOM; the active data-theme picks
// one, so switching Light/Dark never waits on an image request.
export const lightImageStyles: SxProps<Theme> = (theme) => ({
  display: 'block',
  ...theme.applyStyles('dark', { display: 'none' }),
});

export const darkImageStyles: SxProps<Theme> = (theme) => ({
  display: 'none',
  ...theme.applyStyles('dark', { display: 'block' }),
});
