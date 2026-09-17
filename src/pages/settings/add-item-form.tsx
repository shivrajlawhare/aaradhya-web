import { useForm } from 'react-hook-form';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import type { SectionConfig } from './settings-sections';
import { fieldStackStyles, formStyles } from './add-item-form.styles';

interface AddItemFormValues {
  name: string;
  cost: string;
}

export interface AddItemFormSubmitValues {
  name: string;
  cost?: number;
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
    defaultValues: { name: '', cost: '' },
  });

  const name = watch('name');
  const canSubmit = name.trim().length > 0;

  const handleAdd = (values: AddItemFormValues) => {
    if (isPending || !canSubmit) {
      return;
    }
    onSubmit({
      name: values.name,
      cost: section.costLabel && values.cost.trim() !== '' ? Number(values.cost) : undefined,
    });
  };

  return (
    <Paper component="form" onSubmit={handleSubmit(handleAdd)} noValidate sx={formStyles}>
      <Stack sx={fieldStackStyles}>
        <Typography variant="titleM" component="h2">
          Add {section.label.replace(/s$/, '')}
        </Typography>
        <TextField label="Name" fullWidth {...register('name')} />
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
