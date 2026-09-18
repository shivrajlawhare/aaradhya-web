import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import { Controller, useForm } from 'react-hook-form';
import { tsr } from '../../api/client';
import { fromPickerDate, fromPickerTime, toPickerDate, toPickerTime } from '../event-detail/date-input';
import { useEventWizard } from '../../stores/event-wizard-context';
import { formatEventDate, formatSessionDuration } from '../../utils/quotation-formatting';
import { enumerateDates, getDistinctDates } from '../../utils/session-dates';
import {
  addButtonStyles,
  formCardStyles,
  rowStyles,
  tableCardStyles,
  timeFieldStyles,
  wrapperStyles,
} from './event-details-step.styles';

// A distinct sentinel from any real Event Type Master name — this story's
// own AC: "plus a free-text custom option," same "dropdown + custom"
// convention this app already uses elsewhere (session-form-options.ts's
// own CUSTOM_SESSION_TYPE_OPTION).
const CUSTOM_EVENT_TYPE_OPTION = 'Custom…';

// A Session row as this step holds it — field names match
// createSessionBodySchema (contract/index.ts) one-for-one (sessionType,
// venue, venueCost, pax, startDate/endDate, startTime/endTime) since this
// is exactly what STORY-068's eventual POST /events call needs to send;
// nothing here is submitted yet (SRS FR-EVT-8 — held in the wizard store
// until Step 5).
export interface WizardSessionRow {
  id: string;
  sessionType: string;
  venue: string;
  venueCost: number;
  pax: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

interface EventDetailsStepData {
  sessions: WizardSessionRow[];
}

const isEventDetailsStepData = (value: unknown): value is EventDetailsStepData =>
  typeof value === 'object' && value !== null && Array.isArray((value as EventDetailsStepData).sessions);

// The minimal shape STORY-067 (Sessions & Items) is expected to store its
// own step data in: one array of arbitrary per-date entries, keyed by date
// ('YYYY-MM-DD'), under `byDate`. This story's own AC needs enough of a
// contract to actually locate and clear a date's entries when a Session on
// that date is removed, without needing to know what's inside them —
// whatever richer shape lives inside each date's own array is entirely
// STORY-067's own to define.
interface SessionsItemsStoreShape {
  byDate?: Record<string, unknown[]>;
}

interface EntryFormValues {
  sessionTypeOption: string;
  sessionTypeCustom: string;
  venue: string;
  venueCost: number;
  pax: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

const emptyEntry: EntryFormValues = {
  sessionTypeOption: '',
  sessionTypeCustom: '',
  venue: '',
  venueCost: 0,
  pax: 0,
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
};

// Time+random, not a module-level counter — same reasoning as
// client-details-step.tsx's own createRowId (avoids colliding with an id
// already sitting in sessionStorage from before a reload reset a counter).
const createRowId = (): string => `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Wizard Step 2 (STORY-065). Local row-list state (not react-hook-form for
// the table itself — only the entry form above it needs a form), mirrored
// into the wizard store on every change, same pattern client-details-step.tsx
// already established.
const EventDetailsStep = () => {
  const { data, setStepData } = useEventWizard();
  const stored = data['event-details'];

  const [rows, setRows] = useState<WizardSessionRow[]>(() => (isEventDetailsStepData(stored) ? stored.sessions : []));

  useEffect(() => {
    setStepData('event-details', { sessions: rows });
  }, [rows, setStepData]);

  const eventTypesQuery = tsr.listEventTypes.useQuery({ queryKey: ['event-types'] });
  const activeEventTypes = (eventTypesQuery.data?.body ?? []).filter((eventType) => eventType.active);

  const venuesQuery = tsr.listVenues.useQuery({ queryKey: ['venues'] });
  const activeVenues = (venuesQuery.data?.body ?? []).filter((venue) => venue.active);

  // Same "don't render the form until its master-list options actually
  // exist" gate SettingsPage/UserManagementPage already use — an Event
  // Type/Venue Select that opens to a near-empty menu because its own
  // GET hasn't resolved yet is worse than a brief spinner.
  const isMasterListsLoading = eventTypesQuery.isPending || venuesQuery.isPending;

  const { control, register, handleSubmit, watch, setValue, setError, clearErrors, reset } = useForm<EntryFormValues>({
    defaultValues: emptyEntry,
  });
  const sessionTypeOption = watch('sessionTypeOption');

  const handleVenueChange = (venueName: string) => {
    const selected = activeVenues.find((venue) => venue.name === venueName);
    if (selected) {
      setValue('venueCost', selected.defaultVenueCost);
    }
  };

  const handleAddEvent = handleSubmit((values) => {
    // Blocked client-side before this ever becomes a row (this story's own
    // AC) — plain string comparison, since 'YYYY-MM-DD' values sort
    // lexicographically the same as chronologically; matches
    // session-form.tsx's own identical check.
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      setError('endDate', { message: 'End date must be on or after start date.' });
      return;
    }
    clearErrors('endDate');

    const sessionType =
      values.sessionTypeOption === CUSTOM_EVENT_TYPE_OPTION ? values.sessionTypeCustom.trim() : values.sessionTypeOption;

    setRows((current) => [
      ...current,
      {
        id: createRowId(),
        sessionType,
        venue: values.venue,
        venueCost: values.venueCost,
        pax: values.pax,
        startDate: values.startDate,
        endDate: values.endDate,
        startTime: values.startTime,
        endTime: values.endTime,
      },
    ]);
    reset(emptyEntry);
  });

  // Removing a Session also removes any Step 4 (Sessions & Items) entries
  // already made against that Session's own date(s), with a confirmation
  // prompt if any exist (this story's own AC) — STORY-067 gives Step 4 real
  // content, keyed by every calendar date a Session spans (not just its
  // startDate), so a multi-day Session's removal is checked/cleared across
  // its whole date range. A date still covered by another remaining Session
  // (e.g. two same-day Sessions at different venues) is never touched here
  // — its own tab, and whatever was entered against it, still legitimately
  // exists after this one Session is gone.
  const handleRemoveRow = (row: WizardSessionRow) => {
    const remainingRows = rows.filter((existing) => existing.id !== row.id);
    const remainingDates = new Set(getDistinctDates(remainingRows));
    const orphanedDates = enumerateDates(row.startDate, row.endDate).filter((date) => !remainingDates.has(date));

    const sessionsItemsData = data['sessions-items'] as SessionsItemsStoreShape | undefined;
    const datesWithEntries = orphanedDates.filter((date) => (sessionsItemsData?.byDate?.[date] ?? []).length > 0);

    if (datesWithEntries.length > 0) {
      const dateList = datesWithEntries.map(formatEventDate).join(', ');
      const verb = datesWithEntries.length > 1 ? 'already have' : 'already has';
      const confirmed = window.confirm(
        `${dateList} ${verb} Sessions & Items entered in Step 4. Removing this Session will also remove them. Continue?`,
      );
      if (!confirmed) {
        return;
      }
      const remainingByDate = { ...(sessionsItemsData?.byDate ?? {}) };
      for (const date of datesWithEntries) {
        delete remainingByDate[date];
      }
      setStepData('sessions-items', { ...sessionsItemsData, byDate: remainingByDate });
    }

    setRows(remainingRows);
  };

  const formatRowDate = (row: WizardSessionRow): string =>
    row.startDate === row.endDate || !row.endDate
      ? formatEventDate(row.startDate)
      : `${formatEventDate(row.startDate)} - ${formatEventDate(row.endDate)}`;

  if (isMasterListsLoading) {
    return (
      <Stack sx={{ ...wrapperStyles, alignItems: 'center' }}>
        <CircularProgress aria-label="Loading event type and venue options" />
      </Stack>
    );
  }

  return (
    <Stack sx={wrapperStyles}>
      <Paper elevation={0} component="form" onSubmit={handleAddEvent} sx={formCardStyles}>
        <Typography variant="titleM" component="h2">
          Event Details
        </Typography>
        <Stack direction="row" sx={rowStyles}>
          <Controller
            name="sessionTypeOption"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Event Type" sx={{ minWidth: 200 }}>
                <MenuItem value="">Select an event type</MenuItem>
                {activeEventTypes.map((eventType) => (
                  <MenuItem key={eventType.id} value={eventType.name}>
                    {eventType.name}
                  </MenuItem>
                ))}
                <MenuItem value={CUSTOM_EVENT_TYPE_OPTION}>{CUSTOM_EVENT_TYPE_OPTION}</MenuItem>
              </TextField>
            )}
          />
          {sessionTypeOption === CUSTOM_EVENT_TYPE_OPTION && (
            <TextField {...register('sessionTypeCustom')} label="Custom event type" sx={{ minWidth: 200 }} />
          )}
          <Controller
            name="venue"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Venue"
                sx={{ minWidth: 200 }}
                onChange={(event) => {
                  field.onChange(event);
                  handleVenueChange(event.target.value);
                }}
              >
                <MenuItem value="">Select a venue</MenuItem>
                {activeVenues.map((venue) => (
                  <MenuItem key={venue.id} value={venue.name}>
                    {venue.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <TextField
            {...register('venueCost', { valueAsNumber: true })}
            label="Venue Cost"
            type="number"
            slotProps={{ htmlInput: { min: 0 } }}
            sx={{ minWidth: 140 }}
          />
          <TextField
            {...register('pax', { valueAsNumber: true })}
            label="Pax"
            type="number"
            slotProps={{ htmlInput: { min: 0 } }}
            sx={{ minWidth: 120 }}
          />
        </Stack>
        <Stack direction="row" sx={rowStyles}>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Start date"
                value={toPickerDate(field.value)}
                onChange={(date) => field.onChange(fromPickerDate(date))}
                slotProps={{ textField: { onBlur: field.onBlur } }}
              />
            )}
          />
          <Controller
            name="endDate"
            control={control}
            render={({ field, fieldState }) => (
              <DatePicker
                label="End date"
                value={toPickerDate(field.value)}
                onChange={(date) => field.onChange(fromPickerDate(date))}
                slotProps={{
                  textField: {
                    onBlur: field.onBlur,
                    error: Boolean(fieldState.error),
                    helperText: fieldState.error?.message,
                  },
                }}
              />
            )}
          />
        </Stack>
        {/* StaticTimePicker — the always-visible clock face SRS §6.9 calls
            for, not TimePicker's popover-only one, with an explicit AM/PM
            control (`ampm`), matching session-form.tsx's own identical
            usage. */}
        <Stack direction="row" sx={rowStyles}>
          <Stack sx={timeFieldStyles}>
            <Typography variant="titleM" component="h3">
              Start time
            </Typography>
            <Controller
              name="startTime"
              control={control}
              render={({ field }) => (
                <StaticTimePicker ampm value={toPickerTime(field.value)} onChange={(time) => field.onChange(fromPickerTime(time))} />
              )}
            />
          </Stack>
          <Stack sx={timeFieldStyles}>
            <Typography variant="titleM" component="h3">
              End time
            </Typography>
            <Controller
              name="endTime"
              control={control}
              render={({ field }) => (
                <StaticTimePicker ampm value={toPickerTime(field.value)} onChange={(time) => field.onChange(fromPickerTime(time))} />
              )}
            />
          </Stack>
        </Stack>
        <Button type="submit" variant="contained" startIcon={<AddIcon />} sx={addButtonStyles}>
          Add Event
        </Button>
      </Paper>

      <Paper elevation={0} sx={tableCardStyles}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="labelS">Event Type</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="labelS">Date</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="labelS">Duration</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="labelS">Guests</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="labelS">Venue</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="labelS">Cost</Typography>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.sessionType}</TableCell>
                <TableCell>{formatRowDate(row)}</TableCell>
                <TableCell>{formatSessionDuration(row.startTime, row.endTime)}</TableCell>
                <TableCell>{row.pax}</TableCell>
                <TableCell>{row.venue}</TableCell>
                <TableCell>{row.venueCost}</TableCell>
                <TableCell>
                  <IconButton aria-label={`Remove ${row.sessionType || 'event'} row`} size="small" onClick={() => handleRemoveRow(row)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
};

export default EventDetailsStep;
