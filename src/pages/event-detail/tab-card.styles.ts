import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

// Shared by every Event Detail tab (Figma 07 Event Detail): the tab panel's
// vertical rhythm and its content cards.
export const tabSectionStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
};

export const tabCardStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[16]}px`,
};

// A primary action under a card's content (Save …): full width on mobile.
export const tabActionStyles: SxProps<Theme> = {
  alignSelf: { xs: 'stretch', md: 'flex-start' },
};
