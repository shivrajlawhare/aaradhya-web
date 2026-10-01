import type { Ref } from 'react';
import { InputAdornment, type SxProps, TextField, type Theme } from '@mui/material';

export const DISCOUNT_PERCENT_ERROR = 'Enter a whole number from 0 to 100.';

interface DiscountPercentFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  isInvalid: boolean;
  // Lets a form library focus the field when a submit fails validation.
  inputRef?: Ref<HTMLInputElement>;
  sx?: SxProps<Theme>;
}

// The Accommodation "Discount (%)" input (DEV-07 / D3): a whole number
// 0–100 with a % suffix. Controlled with the raw text so a half-typed or
// out-of-range value stays visible next to its error instead of snapping
// back; parsing and validation (isValidDiscountPercent) are the caller's.
const DiscountPercentField = ({ value, onChange, onBlur, isInvalid, inputRef, sx }: DiscountPercentFieldProps) => {
  const helperText = isInvalid ? DISCOUNT_PERCENT_ERROR : undefined;

  return (
    <TextField
      label="Discount (%)"
      type="number"
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      inputRef={inputRef}
      error={isInvalid}
      helperText={helperText}
      sx={sx}
      slotProps={{
        htmlInput: { min: 0, max: 100, step: 1, inputMode: 'numeric' },
        input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
      }}
    />
  );
};

export default DiscountPercentField;
