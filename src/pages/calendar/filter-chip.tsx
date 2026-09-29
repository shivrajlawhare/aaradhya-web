import type { MouseEvent, ReactElement } from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Box, Chip, Typography } from '@mui/material';
import { chevronStyles, chipLabelStyles, chipStyles } from './filter-chip.styles';

interface FilterChipProps {
  label: string;
  active: boolean;
  isOpen?: boolean;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
}

// Shared by every filter chip (Status/Venue/Event/Event Manager/Event
// Type), so the active/inactive treatment and the accessible selected state
// stay identical everywhere. `aria-pressed` carries the "checked/selected"
// state for assistive tech — color alone isn't enough.
const FilterChip = ({ label, active, isOpen = false, onClick }: FilterChipProps) => {
  let icon: ReactElement | undefined;
  if (active) {
    icon = <CheckRoundedIcon aria-hidden />;
  }

  return (
    <Chip
      icon={icon}
      label={
        <Box component="span" sx={chipLabelStyles}>
          <Typography variant="labelM" component="span">
            {label}
          </Typography>
          <ExpandMoreRoundedIcon aria-hidden sx={chevronStyles(isOpen)} />
        </Box>
      }
      onClick={onClick}
      aria-pressed={active}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      sx={chipStyles(active, isOpen)}
    />
  );
};

export default FilterChip;
