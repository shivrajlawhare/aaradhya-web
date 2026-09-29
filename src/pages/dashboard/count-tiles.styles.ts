import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens, shadowTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

export type StatTileTone = 'orange' | 'espresso' | 'custard' | 'tonal';

// 4 across on desktop, a 2×2 grid on mobile (Figma Stat Tile Desktop 254×160
// / Mobile 171×128).
export const rowStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
};

interface ToneColors {
  background: string;
  text: string;
}

const TONE_COLORS: Record<StatTileTone, ToneColors> = {
  orange: { background: 'primary.main', text: 'primary.contrastText' },
  espresso: { background: paletteVar('brand-inverse'), text: paletteVar('brand-onInverse') },
  custard: { background: 'background.paper', text: 'text.primary' },
  tonal: { background: paletteVar('brand-tonal'), text: paletteVar('brand-onTonal') },
};

const TILE_HEIGHT_DESKTOP = 160;
const TILE_HEIGHT_MOBILE = 128;

export const tileStyles = (tone: StatTileTone): SxProps<Theme> => ({
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: { xs: TILE_HEIGHT_MOBILE, md: TILE_HEIGHT_DESKTOP },
  p: { xs: `${space[16]}px`, md: `${space[24]}px` },
  bgcolor: TONE_COLORS[tone].background,
  color: TONE_COLORS[tone].text,
  border: `${stroke.bold}px solid ${paletteVar('brand-borderStrong')}`,
  borderRadius: `${radius.lg}px`,
  boxShadow: shadowTokens.hardMd,
});

// Label and count sit above the corner decor.
export const tileTextStyles: SxProps<Theme> = {
  position: 'relative',
};

export const tileValueStyles: SxProps<Theme> = {
  position: 'relative',
  fontVariantNumeric: 'tabular-nums',
};

// Decor/Stat Tile, flipped vertically and pinned to the bottom-right corner
// (Figma: 150×120 on desktop, 96×77 on mobile).
export const decorStyles: SxProps<Theme> = {
  position: 'absolute',
  right: 0,
  bottom: 0,
  width: { xs: 96, md: 150 },
  height: { xs: 77, md: 120 },
  transform: 'scaleY(-1)',
  pointerEvents: 'none',
};
