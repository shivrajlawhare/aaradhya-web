import type { ReactNode } from 'react';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import { Box, Chip, Typography } from '@mui/material';
import { formatRupees } from '../../pages/event-detail/format-amount';
import { formatNumberedMenuItem } from '../../utils/menu-item-numbering';
import { formatQuotationPax } from '../../utils/quotation-formatting';
import { formatFoodCostLine } from './food-cost-line';
import {
  chipListStyles,
  chipStyles,
  costLineStyles,
  costLineTotalStyles,
  detailIconStyles,
  detailLineStyles,
  detailStyles,
} from './item-card.styles';

interface ItemCardTimeProps {
  // "7pm to 8pm"; nothing renders when empty.
  duration: string;
}

// A Ceremony card's clock line.
export const ItemCardTime = ({ duration }: ItemCardTimeProps) => {
  if (!duration) {
    return null;
  }
  return (
    <Box sx={detailLineStyles}>
      <Box component="span" sx={detailStyles}>
        <ScheduleOutlinedIcon aria-hidden sx={detailIconStyles} />
        <Typography variant="bodyS" component="span">
          {duration}
        </Typography>
      </Box>
    </Box>
  );
};

interface ItemCardFoodDetailsProps {
  pax: number;
  limitedSeating: boolean;
  // Absent for a role that sees no money (F&B Head): no cost, no cost line.
  costPerPlate?: number;
  menuItemNames: string[];
  // Names the chip list for assistive tech.
  menuLabel: string;
}

// A Food/Dining card's pax · cost line, the "N pax × ₹ X = ₹ Y" cost line
// (R3) and its numbered menu-item chips (R1).
export const ItemCardFoodDetails = ({
  pax,
  limitedSeating,
  costPerPlate,
  menuItemNames,
  menuLabel,
}: ItemCardFoodDetailsProps) => {
  let costPerPlateContent: ReactNode = null;
  let costLineContent: ReactNode = null;
  if (costPerPlate !== undefined) {
    const { calculation, total } = formatFoodCostLine({ pax, limitedSeating, costPerPlate });
    costPerPlateContent = (
      <Typography variant="bodyS" component="span">
        {formatRupees(costPerPlate)}
      </Typography>
    );
    costLineContent = (
      <Typography variant="bodyS" component="p" sx={costLineStyles}>
        {calculation}{' '}
        <Typography variant="numeric" component="span" sx={costLineTotalStyles}>
          {total}
        </Typography>
      </Typography>
    );
  }

  return (
    <>
      <Box sx={detailLineStyles}>
        <Box component="span" sx={detailStyles}>
          <GroupsOutlinedIcon aria-hidden sx={detailIconStyles} />
          <Typography variant="bodyS" component="span">
            {formatQuotationPax(pax, limitedSeating)}
          </Typography>
        </Box>
        {costPerPlateContent}
      </Box>
      {costLineContent}
      {menuItemNames.length > 0 && (
        <Box component="ul" aria-label={menuLabel} sx={chipListStyles}>
          {menuItemNames.map((name, index) => (
            <li key={`${name}-${index}`}>
              <Chip size="small" label={formatNumberedMenuItem(name, index)} sx={chipStyles} />
            </li>
          ))}
        </Box>
      )}
    </>
  );
};
