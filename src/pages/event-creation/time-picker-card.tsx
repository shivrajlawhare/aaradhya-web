import { Box } from '@mui/material';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import { fromPickerTime, toPickerTime } from '../event-detail/date-input';
import { timePickerCardStyles } from './time-picker-card.styles';

// Figma Picker/Time Static (actions hidden): the clock commits on change, so
// the Cancel/OK action bar is dropped.
const HIDDEN_PICKER_ACTIONS = { actionBar: { actions: [] } };

interface TimePickerCardProps {
  // 'HH:mm', or '' when unset.
  value: string;
  onChange: (value: string) => void;
}

// The wizard's always-visible clock face (SRS §6.9 — not TimePicker's
// popover-only one) with an explicit AM/PM control, in a bordered card.
// Shared by steps 2, 3 and 4.
const TimePickerCard = ({ value, onChange }: TimePickerCardProps) => (
  <Box sx={timePickerCardStyles}>
    <StaticTimePicker
      ampm
      slotProps={HIDDEN_PICKER_ACTIONS}
      value={toPickerTime(value)}
      onChange={(time) => onChange(fromPickerTime(time))}
    />
  </Box>
);

export default TimePickerCard;
