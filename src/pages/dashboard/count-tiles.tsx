import { Paper, Stack, Typography } from '@mui/material';
import type { z } from 'zod';
import type { dashboardResultSchema } from '../../contract';
import { rowStyles, tileStyles, tileValueStyles } from './count-tiles.styles';

type DashboardCounts = z.infer<typeof dashboardResultSchema>['counts'];

interface CountTilesProps {
  counts: DashboardCounts;
}

// One tile per SRS FR-ROLE-2 count, in the order it names them — always
// renders all four with a real 0, never blank (this story's own edge case:
// zero upcoming events still shows a `0` tile, not a missing one).
const TILES: { key: keyof DashboardCounts; label: string }[] = [
  { key: 'todaysEvents', label: "Today's Events" },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'tentative', label: 'Tentative' },
  { key: 'confirmed', label: 'Confirmed' },
];

const CountTiles = ({ counts }: CountTilesProps) => (
  <Stack direction="row" sx={rowStyles}>
    {TILES.map((tile) => (
      <Paper key={tile.key} sx={tileStyles}>
        <Typography variant="labelS">{tile.label}</Typography>
        {/* type-title-l, not type-display — Fraunces is reserved for the
            few places the theme's own rule calls "the app speaking as
            Aaradhya" (wordmark, Quotation header, Grand Total); a
            functional dashboard count isn't one of those, so this story's
            own either/or Tokens line resolves to titleL. */}
        <Typography variant="titleL" sx={tileValueStyles}>
          {counts[tile.key]}
        </Typography>
      </Paper>
    ))}
  </Stack>
);

export default CountTiles;
