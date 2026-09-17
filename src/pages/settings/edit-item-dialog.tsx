import { useForm } from 'react-hook-form';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import type { MasterListRow, SectionConfig } from './settings-sections';

interface EditItemFormValues {
  name: string;
  cost: string;
}

export interface EditItemSubmitValues {
  name: string;
  cost?: number;
}

interface EditItemDialogProps {
  section: SectionConfig;
  row: MasterListRow;
  isPending: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSave: (values: EditItemSubmitValues) => void;
}

// The Edit action's "small dialog" (this story's own AC offers inline-or-
// dialog; a Dialog was chosen so editing name/cost never disturbs the
// table/card list's own layout mid-row). Active isn't editable here — the
// table/card list's own Switch already handles Deactivate/Reactivate as an
// immediate, separate action, matching UsersTable's existing split between
// its role Select and its active Switch.
const EditItemDialog = ({ section, row, isPending, errorMessage, onClose, onSave }: EditItemDialogProps) => {
  const { register, handleSubmit, watch } = useForm<EditItemFormValues>({
    defaultValues: { name: row.name, cost: row.cost === null ? '' : String(row.cost) },
  });

  const name = watch('name');
  const canSubmit = name.trim().length > 0;

  const handleEdit = (values: EditItemFormValues) => {
    if (isPending || !canSubmit) {
      return;
    }
    onSave({
      name: values.name,
      cost: section.costLabel && values.cost.trim() !== '' ? Number(values.cost) : undefined,
    });
  };

  return (
    <Dialog open onClose={onClose} component="form" onSubmit={handleSubmit(handleEdit)}>
      <DialogTitle>Edit {section.label.replace(/s$/, '')}</DialogTitle>
      <DialogContent>
        <Stack sx={{ gap: 2, pt: 1, minWidth: 280 }}>
          <TextField label="Name" fullWidth autoFocus {...register('name')} />
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
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={!canSubmit || isPending}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditItemDialog;
