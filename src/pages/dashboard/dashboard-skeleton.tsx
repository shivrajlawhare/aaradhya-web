import { Box, Skeleton } from '@mui/material';
import TableSkeleton from '../../components/ui/table-skeleton';
import { rowStyles } from './count-tiles.styles';
import {
  cardClientBarStyles,
  cardDateBarStyles,
  cardListSkeletonStyles,
  cardSkeletonStyles,
  cardSkeletonTextStyles,
  dateBlockBarStyles,
  tileCaptionBarStyles,
  tileCountBarStyles,
  tileLabelBarStyles,
  tileSkeletonStyles,
} from './dashboard-skeleton.styles';

const TILE_COUNT = 4;
const ROW_COUNT = 5;
const TABLE_TEXT_COLUMN_COUNT = 5;

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
  <TableSkeleton rowCount={ROW_COUNT} textColumnCount={TABLE_TEXT_COLUMN_COUNT} />
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
