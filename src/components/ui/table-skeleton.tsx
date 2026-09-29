import { Box, Skeleton } from '@mui/material';
import { chipBarStyles, tableRowSkeletonStyles, tableSkeletonStyles } from './table-skeleton.styles';

interface TableSkeletonProps {
  rowCount: number;
  // Text columns before the trailing status-chip column.
  textColumnCount: number;
}

const placeholders = (count: number) => Array.from({ length: count }, (_, index) => index);

// Placeholder rows shown while a table's data loads (Figma Skeleton/Table Row).
const TableSkeleton = ({ rowCount, textColumnCount }: TableSkeletonProps) => (
  <Box sx={tableSkeletonStyles}>
    {placeholders(rowCount).map((row) => (
      <Box key={row} sx={tableRowSkeletonStyles(textColumnCount)}>
        {placeholders(textColumnCount).map((column) => (
          <Skeleton key={column} variant="text" />
        ))}
        <Skeleton variant="rounded" sx={chipBarStyles} />
      </Box>
    ))}
  </Box>
);

export default TableSkeleton;
