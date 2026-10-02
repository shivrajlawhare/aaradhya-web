import { Chip } from '@mui/material';
import { activeStatusChipStyles } from './active-status-chip.styles';

interface ActiveStatusChipProps {
  active: boolean;
}

// Figma Chip/Status "• Active" (green) / "• Inactive" (muted) — User
// Management and the Settings master lists.
const ActiveStatusChip = ({ active }: ActiveStatusChipProps) => {
  let label = 'Inactive';
  if (active) {
    label = 'Active';
  }
  return <Chip label={label} size="small" sx={activeStatusChipStyles(active)} />;
};

export default ActiveStatusChip;
