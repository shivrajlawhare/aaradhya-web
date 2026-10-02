import { InputAdornment } from '@mui/material';

// slotProps for a Settings money field: ₹ prefix, no negatives. Shared by
// the add form and the edit dialog.
export const RUPEE_INPUT = {
  htmlInput: { min: 0 },
  input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
};
