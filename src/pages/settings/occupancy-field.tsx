import { TextField } from '@mui/material';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { OCCUPANCY_ERROR } from './settings-sections';

interface OccupancyFieldProps {
  registration: UseFormRegisterReturn;
  isInvalid: boolean;
}

// A Room Type's per-room guest count (DEV-07), shared by the "+ Add" form
// and the Edit dialog.
const OccupancyField = ({ registration, isInvalid }: OccupancyFieldProps) => {
  const helperText = isInvalid ? OCCUPANCY_ERROR : 'Guests per room';

  return (
    <TextField
      label="Occupancy"
      type="number"
      fullWidth
      error={isInvalid}
      helperText={helperText}
      slotProps={{ htmlInput: { min: 0, step: 1 } }}
      {...registration}
    />
  );
};

export default OccupancyField;
