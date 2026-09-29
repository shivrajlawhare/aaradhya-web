import type { SxProps, Theme } from '@mui/material';
import type { SystemStyleObject } from '@mui/system';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

// Same page rhythm as the Dashboard (Figma Main: 32/40 desktop, 16 mobile).
export const pageStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${space[24]}px`, md: `${space[32]}px` },
  px: { xs: `${space[16]}px`, md: `${space[40]}px` },
  pt: { xs: `${space[16]}px`, md: `${space[32]}px` },
  pb: `${space[40]}px`,
};

const outlinedCard: SystemStyleObject<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
};

// Figma Skeleton/Event Card for the mobile list while Events load.
export const cardSkeletonListStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[12]}px`,
};

export const cardSkeletonStyles: SxProps<Theme> = {
  ...outlinedCard,
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[8]}px`,
  p: `${space[16]}px`,
  borderRadius: `${radius.lg}px`,
};

export const cardTitleBarStyles: SxProps<Theme> = { width: '55%', height: 28 };
export const cardIdBarStyles: SxProps<Theme> = { width: '40%' };
export const cardMetaBarStyles: SxProps<Theme> = { width: '75%' };
