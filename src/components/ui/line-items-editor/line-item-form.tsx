import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, InputAdornment, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { actionsStyles, fieldsStyles, formStyles, submitButtonStyles } from './line-item-form.styles';

export interface LineItemValues {
  name: string;
  note: string;
  amount: number;
}

const EMPTY_VALUES: LineItemValues = { name: '', note: '', amount: 0 };

const NAME_REQUIRED = 'Enter a name.';
const SAVE_LABEL = 'Save line item';
const CANCEL_LABEL = 'Cancel edit';
const NAME_LABEL = 'Name';
const NOTE_LABEL = 'Note (optional)';
const AMOUNT_LABEL = 'Total Cost';

const RUPEE_ADORNMENT = { input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } };

interface LineItemFormProps {
  // Add mode button text — the wizard says "Add Line Item", Event Detail
  // "Add line item" (5C.3).
  addLabel: string;
  // Present while editing an existing row: the form starts from it and
  // shows "Save line item" / "Cancel edit" instead of the add button.
  editing?: LineItemValues;
  onCancelEdit?: () => void;
  // Trimmed values. A rejected promise keeps what was typed (the save
  // failed); a resolved one clears the form for the next item.
  onSubmit: (values: LineItemValues) => void | Promise<void>;
  disabled?: boolean;
}

// Name · Note (optional) · Total Cost and its submit button — the one
// line-item form wizard step 5 and Event Detail's LineItemsEditor share
// (DEV-20, UI-48).
const LineItemForm = ({ addLabel, editing, onCancelEdit, onSubmit, disabled = false }: LineItemFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LineItemValues>({ defaultValues: editing ?? EMPTY_VALUES });

  const handleFormSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        note: values.note.trim(),
        amount: Number.isFinite(values.amount) ? values.amount : 0,
      });
      reset(EMPTY_VALUES);
    } catch {
      // The caller already reported the failure; keep the typed values.
    } finally {
      setIsSubmitting(false);
    }
  });

  const isBusy = disabled || isSubmitting;
  let actions = (
    <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={isBusy} sx={submitButtonStyles}>
      {addLabel}
    </Button>
  );
  if (editing) {
    actions = (
      <Box sx={actionsStyles}>
        <Button type="submit" variant="contained" disabled={isBusy} sx={submitButtonStyles}>
          {SAVE_LABEL}
        </Button>
        <Button variant="text" onClick={onCancelEdit} disabled={isBusy} sx={submitButtonStyles}>
          {CANCEL_LABEL}
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" noValidate onSubmit={handleFormSubmit} sx={formStyles}>
      <Box sx={fieldsStyles}>
        <TextField
          {...register('name', { validate: (value) => value.trim().length > 0 || NAME_REQUIRED })}
          label={NAME_LABEL}
          fullWidth
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
        />
        <TextField {...register('note')} label={NOTE_LABEL} fullWidth />
        <TextField
          {...register('amount', { valueAsNumber: true })}
          label={AMOUNT_LABEL}
          type="number"
          fullWidth
          slotProps={{ htmlInput: { min: 0 }, ...RUPEE_ADORNMENT }}
        />
      </Box>
      {actions}
    </Box>
  );
};

export default LineItemForm;
