import { Chip } from '@mui/material';
import type { EventStatus } from '../../contract';
import { STATUS_CHIP_COLORS } from './status-chip.styles';

interface StatusChipProps {
  status: EventStatus;
}

// Shared by the Event list (STORY-016) and the Event Detail header
// (STORY-017) — hoisted here once a second consumer needed the exact same
// status-to-color mapping, per "extract once a pattern genuinely repeats."
const StatusChip = ({ status }: StatusChipProps) => (
  <Chip label={status} size="small" style={STATUS_CHIP_COLORS[status]} />
);

export default StatusChip;
