import type { FormEventHandler } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { Controller, type UseFormReturn } from 'react-hook-form';
import ItemTimeClocks from './item-time-clocks';
import {
  CEREMONY_EVENT_NAME_PRESETS,
  type CeremonyFormValues,
  CUSTOM_CEREMONY_EVENT_OPTION,
} from './sessions-items-forms';
import {
  fieldColumnStyles,
  formActionsStyles,
  sectionBodyStyles,
  sectionCardStyles,
} from './sessions-items-step.styles';
import { CEREMONY_CARD_ID } from './wizard-item-actions';

interface CeremonyFormCardProps {
  form: UseFormReturn<CeremonyFormValues>;
  isEditing: boolean;
  // The Event Detail tab saves to the API: submit waits for a change and
  // for any in-flight save; the wizard leaves both off.
  isSubmitDisabled?: boolean;
  isSubmitting?: boolean;
  submitError?: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancelEdit: () => void;
}

// The Ceremony Events card (Figma 05 New Event / 4): Event Name (preset or
// custom) and the actions on the left, Start/End clocks on the right.
const CeremonyFormCard = ({
  form,
  isEditing,
  isSubmitDisabled = false,
  isSubmitting = false,
  submitError = null,
  onSubmit,
  onCancelEdit,
}: CeremonyFormCardProps) => {
  const nameOption = form.watch('eventNameOption');
  const submitLabel = isEditing ? 'Save Ceremony Event' : 'Add Ceremony Event';

  return (
    <Paper
      elevation={0}
      component="form"
      id={CEREMONY_CARD_ID}
      aria-label="Ceremony Events"
      onSubmit={onSubmit}
      sx={sectionCardStyles}
    >
      <Typography variant="titleM" component="h2">
        Ceremony Events
      </Typography>
      <Box sx={sectionBodyStyles}>
        <Stack sx={fieldColumnStyles}>
          <Controller
            name="eventNameOption"
            control={form.control}
            render={({ field }) => (
              <TextField {...field} select fullWidth label="Event Name">
                <MenuItem value="">Select an event name</MenuItem>
                {CEREMONY_EVENT_NAME_PRESETS.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
                <MenuItem value={CUSTOM_CEREMONY_EVENT_OPTION}>{CUSTOM_CEREMONY_EVENT_OPTION}</MenuItem>
              </TextField>
            )}
          />
          {nameOption === CUSTOM_CEREMONY_EVENT_OPTION && (
            <TextField {...form.register('eventNameCustom')} fullWidth label="Custom event name" />
          )}
          {submitError && (
            <Alert severity="error">
              <Typography variant="bodyM">{submitError}</Typography>
            </Alert>
          )}
          <Box sx={formActionsStyles}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<AddIcon />}
              disabled={isSubmitDisabled || isSubmitting}
            >
              {submitLabel}
            </Button>
            {isEditing && (
              <Button variant="ghost" onClick={onCancelEdit} disabled={isSubmitting}>
                Cancel edit
              </Button>
            )}
          </Box>
        </Stack>
        <ItemTimeClocks
          startTime={form.watch('startTime')}
          endTime={form.watch('endTime')}
          onStartTimeChange={(value) => form.setValue('startTime', value)}
          onEndTimeChange={(value) => form.setValue('endTime', value)}
        />
      </Box>
    </Paper>
  );
};

export default CeremonyFormCard;
