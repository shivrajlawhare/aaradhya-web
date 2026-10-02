import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const FORM_WIDTH = 360;
const ILLUSTRATION_SIZE = 120;

// 360 wide beside the table on desktop; full width on mobile.
export const formStyles: SxProps<Theme> = {
  p: `${space[24]}px`,
  width: '100%',
  maxWidth: { md: FORM_WIDTH },
  flexShrink: 0,
  boxSizing: 'border-box',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
};

export const fieldStackStyles: SxProps<Theme> = {
  gap: `${space[16]}px`,
};

export const illustrationStyles: SxProps<Theme> = {
  width: ILLUSTRATION_SIZE,
  height: ILLUSTRATION_SIZE,
};
