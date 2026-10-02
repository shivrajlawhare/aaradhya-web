import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useForm } from 'react-hook-form';
import { actionsStyles, dialogStyles } from '../../components/ui/responsive-dialog.styles';
import { fieldStackStyles } from './edit-item-dialog.styles';
import OccupancyField from './occupancy-field';
import { RUPEE_INPUT } from './rupee-input';
import { type MasterListRow, parseOccupancy, type SectionConfig } from './settings-sections';

interface EditItemFormValues {
  name: string;
  cost: string;
  occupancy: string;
}

export interface EditItemSubmitValues {
  name: string;
  cost?: number;
  occupancy?: number;
}

interface EditItemDialogProps {
  section: SectionConfig;
  row: MasterListRow;
  isPending: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSave: (values: EditItemSubmitValues) => void;
}

const toInputValue = (value: number | null): string => (value === null ? '' : String(value));

// Figma Dialog/Form "Edit <Section>" (UI-29, UI-40): Name, Occupancy (Room
// Types), the section's cost, then Cancel / Save — Save disabled until
// something changes. A bottom sheet on mobile. Active isn't edited here:
// the list's own switch does that immediately.
const EditItemDialog = ({ section, row, isPending, errorMessage, onClose, onSave }: EditItemDialogProps) => {
  const theme = useTheme();
  const isBottomSheet = !useMediaQuery(theme.breakpoints.up('md'));
  const {
    register,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = useForm<EditItemFormValues>({
    defaultValues: {
      name: row.name,
      cost: toInputValue(row.cost),
      occupancy: toInputValue(row.occupancy),
    },
  });

  const name = watch('name');
  const occupancy = parseOccupancy(watch('occupancy'));
  const isOccupancyInvalid = section.supportsOccupancy && occupancy === null;
  const canSubmit = isDirty && name.trim().length > 0 && !isOccupancyInvalid;

  const handleEdit = (values: EditItemFormValues) => {
    if (isPending || !canSubmit) {
      return;
    }
    onSave({
      name: values.name,
      cost: section.costLabel && values.cost.trim() !== '' ? Number(values.cost) : undefined,
      occupancy: section.supportsOccupancy ? (occupancy ?? undefined) : undefined,
    });
  };

  return (
    <Dialog
      open
      onClose={onClose}
      component="form"
      onSubmit={handleSubmit(handleEdit)}
      aria-labelledby="edit-item-title"
      sx={dialogStyles(isBottomSheet)}
    >
      <DialogTitle id="edit-item-title">Edit {section.label.replace(/s$/, '')}</DialogTitle>
      <DialogContent>
        <Stack sx={fieldStackStyles}>
          <TextField label="Name" fullWidth autoFocus {...register('name')} />
          {section.supportsOccupancy && (
            <OccupancyField registration={register('occupancy')} isInvalid={isOccupancyInvalid} />
          )}
          {section.costLabel && (
            <TextField
              label={section.costLabel}
              type="number"
              fullWidth
              slotProps={RUPEE_INPUT}
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
      <DialogActions sx={actionsStyles(isBottomSheet)}>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSubmit || isPending}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditItemDialog;
