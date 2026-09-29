import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

// Same footprint as the real table container (Figma Table/Container).
export const tableSkeletonStyles: SxProps<Theme> = {
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.md}px`,
  overflow: 'hidden',
};

// Same 56 px body row height as the real table (MuiTableCell override).
const TABLE_ROW_HEIGHT = 56;

// Figma Skeleton/Table Row: one text bar per column, then a chip-shaped bar.
export const tableRowSkeletonStyles = (textColumnCount: number): SxProps<Theme> => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${textColumnCount + 1}, minmax(0, 1fr))`,
  alignItems: 'center',
  gap: `${space[16]}px`,
  px: `${space[16]}px`,
  height: TABLE_ROW_HEIGHT,
  '&:not(:last-of-type)': { borderBottom: `${stroke.hair}px solid ${paletteVar('divider')}` },
});

export const chipBarStyles: SxProps<Theme> = {
  height: 20,
  borderRadius: `${radius.pill}px`,
};
