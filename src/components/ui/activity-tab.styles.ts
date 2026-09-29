import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { controlSize, radius, space, stroke } = scaleTokens;

const AVATAR_SIZE = controlSize.s;
const RAIL_LINE_WIDTH = 2;

export const timelineCardStyles: SxProps<Theme> = {
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
};

// Figma `Timeline/Activity Item`: a rail (avatar + connecting line) beside
// the body (actor/time header over a tinted box of changes). One item per
// grouped save (STORY-081 groupId). The outer level deliberately isn't a
// list: the inner <ul> of field changes (changeListStyles below) is the only
// content with list semantics — nesting a <ul>/<li> inside another <li> made
// `getByRole('listitem')` match both levels indistinguishably in tests.
export const timelineItemStyles: SxProps<Theme> = {
  display: 'flex',
  gap: `${space[16]}px`,
};

export const railStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flexShrink: 0,
  width: AVATAR_SIZE,
};

export const avatarStyles: SxProps<Theme> = {
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  border: `${stroke.default}px solid ${paletteVar('brand-borderStrong')}`,
};

// The line joins this item to the next one; the last item has none.
export const railLineStyles = (hasNext: boolean): SxProps<Theme> => ({
  display: hasNext ? 'block' : 'none',
  flex: 1,
  width: RAIL_LINE_WIDTH,
  bgcolor: 'divider',
});

export const bodyStyles = (hasNext: boolean): SxProps<Theme> => ({
  flex: 1,
  minWidth: 0,
  gap: `${space[8]}px`,
  pb: hasNext ? `${space[24]}px` : 0,
});

export const metaRowStyles: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  columnGap: `${space[8]}px`,
  minHeight: AVATAR_SIZE,
  alignContent: 'center',
};

export const timestampStyles: SxProps<Theme> = {
  color: paletteVar('brand-tertiary'),
};

export const loadingStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'center',
  p: `${space[24]}px`,
};

// The grouped field changes on a tinted panel. A margin/padding reset since
// the browser's own <ul> defaults would otherwise leak in.
export const changeListStyles: SxProps<Theme> = {
  m: 0,
  p: `${space[12]}px`,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 1.5, // theme.spacing → 6 px, the Figma gap between changes
  borderRadius: `${radius.md}px`,
  bgcolor: paletteVar('brand-subtle'),
  overflowWrap: 'anywhere',
};
