import { Box, Paper, Typography } from '@mui/material';
import type { z } from 'zod';
import statTileCustardDarkDecor from '../../assets/decor/stat-tile-custard-dark.svg';
import statTileCustardDecor from '../../assets/decor/stat-tile-custard.svg';
import statTileDarkDecor from '../../assets/decor/stat-tile-dark.svg';
import statTileEspressoDarkDecor from '../../assets/decor/stat-tile-espresso-dark.svg';
import statTileEspressoDecor from '../../assets/decor/stat-tile-espresso.svg';
import statTileDecor from '../../assets/decor/stat-tile.svg';
import ThemedImage, { type ThemedImageSources } from '../../components/ui/themed-image';
import type { dashboardResultSchema } from '../../contract';
import {
  decorStyles,
  rowStyles,
  type StatTileTone,
  tileStyles,
  tileTextStyles,
  tileValueStyles,
} from './count-tiles.styles';
import { useCountUp } from './use-count-up';

type DashboardCounts = z.infer<typeof dashboardResultSchema>['counts'];

interface CountTilesProps {
  counts: DashboardCounts;
}

interface TileDefinition {
  key: keyof DashboardCounts;
  label: string;
  tone: StatTileTone;
}

// One tile per SRS FR-ROLE-2 count, in the order it names them — always
// renders all four with a real 0, never blank (this story's own edge case:
// zero upcoming events still shows a `0` tile, not a missing one).
const TILES: TileDefinition[] = [
  { key: 'todaysEvents', label: "Today's Events", tone: 'orange' },
  { key: 'upcoming', label: 'Upcoming', tone: 'espresso' },
  { key: 'tentative', label: 'Tentative', tone: 'custard' },
  { key: 'confirmed', label: 'Confirmed', tone: 'tonal' },
];

// Figma's Decor/Stat Tile variant per tone (Tonal reuses Custard's).
const TILE_DECOR: Record<StatTileTone, ThemedImageSources> = {
  orange: { light: statTileDecor, dark: statTileDarkDecor },
  espresso: { light: statTileEspressoDecor, dark: statTileEspressoDarkDecor },
  custard: { light: statTileCustardDecor, dark: statTileCustardDarkDecor },
  tonal: { light: statTileCustardDecor, dark: statTileCustardDarkDecor },
};

interface StatTileProps {
  label: string;
  count: number;
  tone: StatTileTone;
}

const StatTile = ({ label, count, tone }: StatTileProps) => {
  const displayedCount = useCountUp(count);

  return (
    <Paper elevation={0} sx={tileStyles(tone)}>
      <ThemedImage {...TILE_DECOR[tone]} sx={decorStyles} />
      <Typography variant="labelS" component="p" sx={tileTextStyles}>
        {label}
      </Typography>
      <Typography variant="display" component="p" sx={tileValueStyles}>
        {displayedCount}
      </Typography>
    </Paper>
  );
};

const CountTiles = ({ counts }: CountTilesProps) => (
  <Box sx={rowStyles}>
    {TILES.map((tile) => (
      <StatTile key={tile.key} label={tile.label} count={counts[tile.key]} tone={tile.tone} />
    ))}
  </Box>
);

export default CountTiles;
