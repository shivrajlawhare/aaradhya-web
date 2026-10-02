import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import { Box, Chip, Typography } from '@mui/material';
import { chipListStyles, chipStyles, detailIconStyles, detailLineStyles, detailStyles } from './item-card.styles';

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
  // "250" or "L.S. (120pax)".
  pax: string;
  // "₹ 450 · Total cost: 1,12,500"; absent for a role that sees no money.
  cost?: string;
  menuItemNames: string[];
  // Names the chip list for assistive tech.
  menuLabel: string;
}

// A Food/Dining card's pax · cost line and its menu-item chips.
export const ItemCardFoodDetails = ({ pax, cost, menuItemNames, menuLabel }: ItemCardFoodDetailsProps) => (
  <>
    <Box sx={detailLineStyles}>
      <Box component="span" sx={detailStyles}>
        <GroupsOutlinedIcon aria-hidden sx={detailIconStyles} />
        <Typography variant="bodyS" component="span">
          {pax}
        </Typography>
      </Box>
      {cost && (
        <Typography variant="bodyS" component="span">
          {cost}
        </Typography>
      )}
    </Box>
    {menuItemNames.length > 0 && (
      <Box component="ul" aria-label={menuLabel} sx={chipListStyles}>
        {menuItemNames.map((name, index) => (
          <li key={`${name}-${index}`}>
            <Chip size="small" label={name} sx={chipStyles} />
          </li>
        ))}
      </Box>
    )}
  </>
);
