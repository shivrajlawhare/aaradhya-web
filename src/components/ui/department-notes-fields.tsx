import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Autocomplete, Box, Chip, Stack, TextField, Typography } from '@mui/material';
import type { z } from 'zod';
import type { sessionDepartmentNotesResultSchema, sessionDepartmentNotesSchema } from '../../contract';
import {
  cardStyles,
  maintenanceChipStyles,
  maintenanceFieldStyles,
  paxFieldStyles,
  paxRowStyles,
  warningStyles,
} from './department-notes-fields.styles';

type DepartmentNotesBody = z.infer<typeof sessionDepartmentNotesSchema>;
type DepartmentNotesResult = z.infer<typeof sessionDepartmentNotesResultSchema>;

// CR-1 D4 — the Notes for Department section as both session forms hold it
// (the wizard's step 2 card and Event Detail's session form). Empty pax
// fields are null.
export interface DepartmentNotesValues {
  vegPax: number | null;
  nonVegPax: number | null;
  maintenance: string[];
  restaurantNote: string;
}

export const EMPTY_DEPARTMENT_NOTES: DepartmentNotesValues = {
  vegPax: null,
  nonVegPax: null,
  maintenance: [],
  restaurantNote: '',
};

// A stored Session's notes as form values; a Session from before DEV-12
// (no notes) reads as empty.
export const toDepartmentNotesValues = (notes: DepartmentNotesResult | undefined): DepartmentNotesValues => ({
  vegPax: notes?.vegPax ?? null,
  nonVegPax: notes?.nonVegPax ?? null,
  maintenance: [...(notes?.maintenance ?? [])],
  restaurantNote: notes?.restaurantNote ?? '',
});

// The form values as a request body — blanks are left out.
export const toDepartmentNotesBody = (values: DepartmentNotesValues | undefined): DepartmentNotesBody => ({
  vegPax: values?.vegPax ?? undefined,
  nonVegPax: values?.nonVegPax ?? undefined,
  maintenance: (values?.maintenance ?? []).map((item) => item.trim()).filter((item) => item !== ''),
  restaurantNote: values?.restaurantNote.trim() || undefined,
});

// "Veg + Non-Veg (N) doesn't match Pax (N)" once either split is entered
// and they don't add up — a warning only, never blocking (UI-44).
export const getPaxSplitWarning = (values: DepartmentNotesValues, pax: number): string | null => {
  if (values.vegPax === null && values.nonVegPax === null) {
    return null;
  }
  const split = (values.vegPax ?? 0) + (values.nonVegPax ?? 0);
  if (split === pax) {
    return null;
  }
  return `Veg + Non-Veg (${split}) doesn’t match Pax (${pax})`;
};

const toPaxValue = (raw: string): number | null => {
  if (raw.trim() === '') {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
};

const NUMBER_INPUT = { htmlInput: { min: 0 } };

interface DepartmentNotesFieldsProps {
  value: DepartmentNotesValues;
  // The session's own pax, for the Veg + Non-Veg check.
  pax: number;
  onChange: (value: DepartmentNotesValues) => void;
}

// Figma Form/Notes for Department (UI-44): Veg / Non-Veg pax, Maintenance
// chips and a Restaurant note, after Setup on the same subtle panel. All
// optional.
const DepartmentNotesFields = ({ value, pax, onChange }: DepartmentNotesFieldsProps) => {
  const warning = getPaxSplitWarning(value, Number.isFinite(pax) ? pax : 0);

  return (
    <Stack component="section" aria-labelledby="department-notes-heading" sx={cardStyles}>
      <Typography id="department-notes-heading" variant="titleS" component="h3">
        Notes for Department
      </Typography>
      <Box sx={paxRowStyles}>
        <TextField
          label="Veg pax"
          type="number"
          value={value.vegPax ?? ''}
          onChange={(event) => onChange({ ...value, vegPax: toPaxValue(event.target.value) })}
          slotProps={NUMBER_INPUT}
          sx={paxFieldStyles}
        />
        <TextField
          label="Non-Veg pax"
          type="number"
          value={value.nonVegPax ?? ''}
          onChange={(event) => onChange({ ...value, nonVegPax: toPaxValue(event.target.value) })}
          slotProps={NUMBER_INPUT}
          sx={paxFieldStyles}
        />
      </Box>
      {warning && (
        <Box role="status" sx={warningStyles}>
          <WarningAmberRoundedIcon fontSize="small" aria-hidden />
          <Typography variant="bodyS">{warning}</Typography>
        </Box>
      )}
      <Autocomplete<string, true, false, true>
        multiple
        freeSolo
        options={[]}
        value={value.maintenance}
        onChange={(_event, items) =>
          onChange({ ...value, maintenance: items.map((item) => item.trim()).filter((item) => item !== '') })
        }
        renderValue={(items, getItemProps) =>
          items.map((item, index) => {
            const { key, ...itemProps } = getItemProps({ index });
            return <Chip key={key} label={item} sx={maintenanceChipStyles} {...itemProps} />;
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Maintenance"
            placeholder="e.g. Sound System"
            helperText="Press Enter to add each item."
            sx={maintenanceFieldStyles}
          />
        )}
      />
      <TextField
        label="Restaurant note"
        multiline
        minRows={2}
        fullWidth
        value={value.restaurantNote}
        onChange={(event) => onChange({ ...value, restaurantNote: event.target.value })}
      />
    </Stack>
  );
};

export default DepartmentNotesFields;
