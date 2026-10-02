import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { tsr } from '../../api/client';
import { actionsStyles, dialogStyles } from '../../components/ui/responsive-dialog.styles';
import type { WizardData } from '../../stores/event-wizard-context';
import { fromPickerDate, toPickerDate } from '../event-detail/date-input';
import { dialogContentStyles, eventDateFieldStyles } from './one-day-event-dialog.styles';
import { buildOneDayEventWizardData } from './one-day-event-prefill';

const REPLACE_WARNING = 'Replace what you’ve entered with the One Day Event template?';
const LOAD_ERROR = 'The One Day Event template couldn’t be loaded. Please try again.';

interface OneDayEventDialogProps {
  // The wizard already holds entered data — shows the replace warning and
  // relabels the primary button "Replace" (UI-41, 5B.3).
  isReplacing: boolean;
  onClose: () => void;
  onApply: (data: WizardData) => void;
}

// Figma Dialog/Form "One Day Event" (UI-41): the required Event date, then
// Cancel / "Prefill event". A bottom sheet on mobile. Rendered only while
// open, so the template and master lists are fetched when someone actually
// starts a One Day Event — never by the shell on every wizard step.
const OneDayEventDialog = ({ isReplacing, onClose, onApply }: OneDayEventDialogProps) => {
  const theme = useTheme();
  const isBottomSheet = !useMediaQuery(theme.breakpoints.up('md'));
  const [eventDate, setEventDate] = useState('');

  const templateQuery = tsr.getOneDayEventTemplate.useQuery({ queryKey: ['one-day-event-template'] });
  const venuesQuery = tsr.listVenues.useQuery({ queryKey: ['venues'] });
  const roomTypesQuery = tsr.listRoomTypes.useQuery({ queryKey: ['room-types'] });

  const template = templateQuery.data?.body;
  const venues = venuesQuery.data?.body;
  const roomTypes = roomTypesQuery.data?.body;
  const isLoading = templateQuery.isPending || venuesQuery.isPending || roomTypesQuery.isPending;
  const isLoadError = templateQuery.isError || venuesQuery.isError || roomTypesQuery.isError;

  let submitLabel = 'Prefill event';
  if (isReplacing) {
    submitLabel = 'Replace';
  }

  const handleApply = () => {
    if (!eventDate || !template || !venues || !roomTypes) {
      return;
    }
    onApply(buildOneDayEventWizardData(template, eventDate, { venues, roomTypes }));
  };

  return (
    <Dialog open onClose={onClose} aria-labelledby="one-day-event-title" sx={dialogStyles(isBottomSheet)}>
      <DialogTitle id="one-day-event-title">Start a One Day Event</DialogTitle>
      <DialogContent sx={dialogContentStyles}>
        <DatePicker
          label="Event date"
          value={toPickerDate(eventDate)}
          onChange={(value) => setEventDate(fromPickerDate(value))}
          slotProps={{ textField: { required: true, fullWidth: true, sx: eventDateFieldStyles } }}
        />
        {isLoadError && (
          <Alert severity="error">
            <Typography variant="bodyM">{LOAD_ERROR}</Typography>
          </Alert>
        )}
        {isReplacing && (
          <Alert severity="warning">
            <Typography variant="bodyM">{REPLACE_WARNING}</Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={actionsStyles(isBottomSheet)}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!eventDate || isLoadError}
          loading={isLoading && !isLoadError}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OneDayEventDialog;
