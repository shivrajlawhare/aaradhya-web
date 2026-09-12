import type { MouseEvent } from 'react';
import { Chip, Typography } from '@mui/material';
import { activeChipStyles, inactiveChipStyles } from './filter-chip.styles';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
}

// Shared by every filter chip — the direct status toggles (All/Tentative/
// Confirmed) and the three picker-trigger chips (Venue/Event Manager/
// Event Type) alike — so the active/inactive treatment (color, per this
// story's own Tokens line) and the accessible selected state stay
// identical everywhere. `aria-pressed` carries the "checked/selected"
// state for assistive tech, per this story's own AC — color alone isn't
// enough.
const FilterChip = ({ label, active, onClick }: FilterChipProps) => (
  <Chip
    label={
      <Typography variant="labelS" component="span">
        {label}
      </Typography>
    }
    onClick={onClick}
    aria-pressed={active}
    sx={active ? activeChipStyles : inactiveChipStyles}
  />
);

export default FilterChip;
