import { Box, Stack, Typography } from '@mui/material';
import { clockRowStyles, timeFieldStyles, timeLabelStyles } from './sessions-items-step.styles';
import TimePickerCard from './time-picker-card';

interface ItemTimeClocksProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

// The Start/End time clock pair on step 4's Ceremony and Food/Dining cards.
const ItemTimeClocks = ({ startTime, endTime, onStartTimeChange, onEndTimeChange }: ItemTimeClocksProps) => (
  <Box sx={clockRowStyles}>
    <Stack sx={timeFieldStyles}>
      <Typography variant="labelS" component="p" sx={timeLabelStyles}>
        Start time
      </Typography>
      <TimePickerCard value={startTime} onChange={onStartTimeChange} />
    </Stack>
    <Stack sx={timeFieldStyles}>
      <Typography variant="labelS" component="p" sx={timeLabelStyles}>
        End time
      </Typography>
      <TimePickerCard value={endTime} onChange={onEndTimeChange} />
    </Stack>
  </Box>
);

export default ItemTimeClocks;
