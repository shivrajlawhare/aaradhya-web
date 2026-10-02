import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

// The pill date tabs hug their content rather than stretching.
export const dateTabsStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
  maxWidth: '100%',
};

export const reminderListStyles: SxProps<Theme> = {
  gap: `${space[8]}px`,
};

// Item cards, 2-up on desktop (Figma 07 Event Detail / Sessions & Items).
export const itemGridStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
  gap: { xs: `${space[12]}px`, md: `${space[24]}px` },
  alignItems: 'start',
  m: 0,
  p: 0,
  listStyle: 'none',
};
