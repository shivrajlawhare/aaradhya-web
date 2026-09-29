import { Box, Skeleton } from '@mui/material';
import { rowStyles } from './count-tiles.styles';
import {
  cardClientBarStyles,
  cardDateBarStyles,
  cardListSkeletonStyles,
  cardSkeletonStyles,
  cardSkeletonTextStyles,
  chipBarStyles,
  dateBlockBarStyles,
  tableRowSkeletonStyles,
  tableSkeletonStyles,
  tileCaptionBarStyles,
  tileCountBarStyles,
  tileLabelBarStyles,
  tileSkeletonStyles,
} from './dashboard-skeleton.styles';

const TILE_COUNT = 4;
const ROW_COUNT = 5;
const TABLE_COLUMN_COUNT = 5;

const placeholders = (count: number) => Array.from({ length: count }, (_, index) => index);

export const CountTilesSkeleton = () => (
  <Box sx={rowStyles}>
    {placeholders(TILE_COUNT).map((index) => (
      <Box key={index} sx={tileSkeletonStyles}>
        <Skeleton variant="text" sx={tileLabelBarStyles} />
        <Skeleton variant="rounded" sx={tileCountBarStyles} />
        <Skeleton variant="text" sx={tileCaptionBarStyles} />
      </Box>
    ))}
  </Box>
);

export const UpcomingTableSkeleton = () => (
  <Box sx={tableSkeletonStyles}>
    {placeholders(ROW_COUNT).map((row) => (
      <Box key={row} sx={tableRowSkeletonStyles}>
        {placeholders(TABLE_COLUMN_COUNT).map((column) => (
          <Skeleton key={column} variant="text" />
        ))}
        <Skeleton variant="rounded" sx={chipBarStyles} />
      </Box>
    ))}
  </Box>
);

export const UpcomingCardsSkeleton = () => (
  <Box sx={cardListSkeletonStyles}>
    {placeholders(ROW_COUNT).map((index) => (
      <Box key={index} sx={cardSkeletonStyles}>
        <Skeleton variant="rounded" sx={dateBlockBarStyles} />
        <Box sx={cardSkeletonTextStyles}>
          <Skeleton variant="text" sx={cardDateBarStyles} />
          <Skeleton variant="text" sx={cardClientBarStyles} />
        </Box>
      </Box>
    ))}
  </Box>
);
