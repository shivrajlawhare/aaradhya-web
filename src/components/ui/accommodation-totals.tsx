import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import {
  breakdownRowStyles,
  breakdownStyles,
  breakdownValueStyles,
  discountStyles,
  finalTileStyles,
  finalValueStyles,
  leadingStyles,
  occupancyStyles,
  rootStyles,
  statLabelStyles,
} from './accommodation-totals.styles';

export interface AccommodationTotalsValues {
  totalOccupancy: number;
  totalCharges: number;
  discountPercent: number;
  discountAmount: number;
  finalAmount: number;
}

interface AccommodationTotalsProps {
  totals: AccommodationTotalsValues;
  // The wizard prints "₹ 1,05,840"; the Event Detail tab prints bare en-IN
  // amounts, as its other money cells do.
  formatMoney: (amount: number) => string;
  // The Discount (%) input — absent where the block is read-only.
  discountField?: ReactNode;
  leading?: ReactNode;
}

// The Accommodation totals block (DEV-07 / D3), shared by wizard step 3 and
// the Event Detail Accommodation tab: Total Occupancy · Total Charges ·
// Discount N% · Final Amount. At a 0% discount the Total Charges / Discount
// rows are hidden and the tile shows Total Charges — the two are equal.
const AccommodationTotals = ({ totals, formatMoney, discountField, leading }: AccommodationTotalsProps) => {
  const hasDiscount = totals.discountPercent > 0;
  const tileLabel = hasDiscount ? 'Final Amount' : 'Total Charges';
  const tileAmount = hasDiscount ? totals.finalAmount : totals.totalCharges;

  return (
    <Box sx={rootStyles(hasDiscount)}>
      <Box sx={leadingStyles}>{leading}</Box>
      <Box sx={discountStyles}>{discountField}</Box>
      <Box sx={occupancyStyles}>
        <Typography variant="labelS" component="p" sx={statLabelStyles}>
          Total Occupancy
        </Typography>
        <Typography variant="h2" component="p">
          {totals.totalOccupancy}
        </Typography>
      </Box>
      {hasDiscount && (
        <Box component="dl" sx={breakdownStyles}>
          <Box sx={breakdownRowStyles}>
            <Typography variant="bodyM" component="dt">
              Total Charges
            </Typography>
            <Typography variant="numeric" component="dd" sx={breakdownValueStyles}>
              {formatMoney(totals.totalCharges)}
            </Typography>
          </Box>
          <Box sx={breakdownRowStyles}>
            <Typography variant="bodyM" component="dt">
              Discount {totals.discountPercent}%
            </Typography>
            <Typography variant="numeric" component="dd" sx={breakdownValueStyles}>
              {formatMoney(totals.discountAmount)}
            </Typography>
          </Box>
        </Box>
      )}
      <Box sx={finalTileStyles}>
        <Typography variant="labelS" component="p">
          {tileLabel}
        </Typography>
        <Typography variant="h2" component="p" sx={finalValueStyles}>
          {formatMoney(tileAmount)}
        </Typography>
      </Box>
    </Box>
  );
};

export default AccommodationTotals;
