import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { radius, space } = scaleTokens;

const DIALOG_WIDTH = 440;

// Figma Dialog/Confirm Destructive: a centred dialog on desktop, a bottom
// sheet (full width, top corners rounded) on mobile.
export const dialogStyles = (isBottomSheet: boolean): SxProps<Theme> => ({
  '& .MuiDialog-container': { alignItems: isBottomSheet ? 'flex-end' : 'center' },
  '& .MuiDialog-paper': isBottomSheet
    ? {
        m: 0,
        width: '100%',
        maxWidth: '100%',
        borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
      }
    : { width: DIALOG_WIDTH, borderRadius: `${radius.xl}px` },
});

export const actionsStyles = (isBottomSheet: boolean): SxProps<Theme> => ({
  flexDirection: isBottomSheet ? 'column-reverse' : 'row',
  alignItems: 'stretch',
  gap: `${space[8]}px`,
  px: `${space[24]}px`,
  pb: `${space[24]}px`,
  '& > :not(style) ~ :not(style)': { ml: 0 },
});
