import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { fieldStackStyles, formStyles } from './add-item-form.styles';
import OccupancyField from './occupancy-field';
import { parseOccupancy, type SectionConfig } from './settings-sections';

interface AddItemFormValues {
  name: string;
  cost: string;
  occupancy: string;
}

export interface AddItemFormSubmitValues {
  name: string;
  cost?: number;
  occupancy?: number;
}

interface AddItemFormProps {
  section: SectionConfig;
  isPending: boolean;
  errorMessage: string | null;
  onSubmit: (values: AddItemFormSubmitValues) => void;
}

// The "+ Add" form (this story's own AC): name, and a default-cost field
// only for a section whose config carries one (costLabel !== null). Parent
// (SettingsPage) owns the actual mutation — which one depends on the
// selected section — and remounts this component (a fresh `key`) on a
// successful add, which is what clears these fields back to blank rather
// than this component tracking success/reset itself.
const AddItemForm = ({ section, isPending, errorMessage, onSubmit }: AddItemFormProps) => {
  const { register, handleSubmit, watch } = useForm<AddItemFormValues>({
    defaultValues: { name: '', cost: '', occupancy: '' },
  });

  const name = watch('name');
  const occupancyInput = watch('occupancy');
  const occupancy = parseOccupancy(occupancyInput);
  // Shown only once something was typed, so a fresh form isn't all red.
  const isOccupancyInvalid = occupancyInput.trim() !== '' && occupancy === null;
  const canSubmit = name.trim().length > 0 && (!section.supportsOccupancy || occupancy !== null);

  const handleAdd = (values: AddItemFormValues) => {
    if (isPending || !canSubmit) {
      return;
    }
    onSubmit({
      name: values.name,
      cost: section.costLabel && values.cost.trim() !== '' ? Number(values.cost) : undefined,
      occupancy: section.supportsOccupancy ? (occupancy ?? undefined) : undefined,
    });
  };

  return (
    <Paper component="form" onSubmit={handleSubmit(handleAdd)} noValidate sx={formStyles}>
      <Stack sx={fieldStackStyles}>
        <Typography variant="titleM" component="h2">
          Add {section.label.replace(/s$/, '')}
        </Typography>
        <TextField label="Name" fullWidth {...register('name')} />
        {section.supportsOccupancy && (
          <OccupancyField registration={register('occupancy')} isInvalid={isOccupancyInvalid} />
        )}
        {section.costLabel && (
          <TextField
            label={section.costLabel}
            type="number"
            fullWidth
            slotProps={{ htmlInput: { min: 0 } }}
            {...register('cost')}
          />
        )}
        {errorMessage && (
          <Alert severity="error">
            <Typography variant="bodyM">{errorMessage}</Typography>
          </Alert>
        )}
        <Button type="submit" variant="contained" disabled={!canSubmit || isPending}>
          Add
        </Button>
      </Stack>
    </Paper>
  );
};

export default AddItemForm;
