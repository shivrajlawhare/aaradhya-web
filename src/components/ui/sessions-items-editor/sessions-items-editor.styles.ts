import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../../theme/tokens';

const { space } = scaleTokens;

export const wrapperStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
};

// The pill date tabs hug their content instead of stretching full width.
export const dateTabsStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
  maxWidth: '100%',
};

export const reminderListStyles: SxProps<Theme> = {
  gap: `${space[8]}px`,
};
