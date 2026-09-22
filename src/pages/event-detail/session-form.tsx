import { useState, type ChangeEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Button, MenuItem, Stack, TextField, ToggleButton, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import { SEATING_ARRANGEMENT_OPTIONS, SeatingArrangement, type filteredEventResultSchema } from '../../contract';
import { fromPickerDate, fromPickerTime, toDateInputValue, toPickerDate, toPickerTime } from './date-input';
import {
  CUSTOM_SESSION_TYPE_OPTION,
  CUSTOM_VENUE_OPTION,
  SEATING_ARRANGEMENT_LABELS,
  SESSION_TYPE_PRESETS,
  VENUE_COST_LOOKUP,
  VENUE_PRESETS,
} from './session-form-options';
import { formStyles, rowStyles, setupCardStyles, timeFieldStyles, toggleActiveStyles } from './session-form.styles';

type PublicEvent = z.infer<typeof filteredEventResultSchema>;
type SessionResult = PublicEvent['sessions'][number];

// This form is only ever reachable through SessionsTab's own canEdit
// (Event Manager) gate, whose sessions always have venueCost/setup present
// unfiltered — the fallback below (and toFormValues' own `session.setup ??
// DEFAULT_SETUP`) exists purely to satisfy their now-`.optional()` type
// (STORY-052's filteredSessionResultSchema), not a real state this form is
// ever built from.
const DEFAULT_SETUP: SessionFormValues['setup'] = {
  seating: '',
  tableCount: 0,
  chairCount: 0,
  stage: false,
  buffet: false,
  registrationDesk: false,
  vipSeating: false,
  brideGroomSeating: false,
  notes: '',
};

interface SessionFormValues {
  sessionTypeOption: string;
  sessionTypeCustom: string;
  venueOption: string;
  venueCustom: string;
  venueCost: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  pax: number;
  setup: {
    seating: SeatingArrangement | '';
    tableCount: number;
    chairCount: number;
    stage: boolean;
    buffet: boolean;
    registrationDesk: boolean;
    vipSeating: boolean;
    brideGroomSeating: boolean;
    notes: string;
  };
}

// A value already in SESSION_TYPE_PRESETS/VENUE_PRESETS pre-selects that
// option with an empty custom field; anything else (including a value from
// an older/removed preset list) falls back to the Custom… option with the
// stored value carried into the custom field — same "dropdown + custom"
// round-trip EventCreationForm already established for event_family_type.
const toOptionParts = (value: string, presets: string[], customOption: string) =>
  presets.includes(value) ? { option: value, custom: '' } : { option: customOption, custom: value };

const toFormValues = (session: SessionResult | undefined): SessionFormValues => {
  if (!session) {
    const defaultVenue = VENUE_PRESETS[0] ?? '';
    return {
      sessionTypeOption: SESSION_TYPE_PRESETS[0] ?? '',
      sessionTypeCustom: '',
      venueOption: defaultVenue,
      venueCustom: '',
      venueCost: VENUE_COST_LOOKUP[defaultVenue] ?? 0,
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      pax: 0,
      setup: DEFAULT_SETUP,
    };
  }

  const sessionTypeParts = toOptionParts(session.sessionType, SESSION_TYPE_PRESETS, CUSTOM_SESSION_TYPE_OPTION);
  const venueParts = toOptionParts(session.venue, VENUE_PRESETS, CUSTOM_VENUE_OPTION);
  const setup = session.setup;
  return {
    sessionTypeOption: sessionTypeParts.option,
    sessionTypeCustom: sessionTypeParts.custom,
    venueOption: venueParts.option,
    venueCustom: venueParts.custom,
    venueCost: session.venueCost ?? 0,
    startDate: toDateInputValue(session.startDate),
    endDate: toDateInputValue(session.endDate),
    startTime: session.startTime ?? '',
    endTime: session.endTime ?? '',
    pax: session.pax,
    setup: setup
      ? {
          seating: setup.seating ?? '',
          tableCount: setup.tableCount,
          chairCount: setup.chairCount,
          stage: setup.stage,
          buffet: setup.buffet,
          registrationDesk: setup.registrationDesk,
          vipSeating: setup.vipSeating,
          brideGroomSeating: setup.brideGroomSeating,
          notes: setup.notes ?? '',
        }
      : DEFAULT_SETUP,
  };
};

interface SessionFormProps {
  eventId: string;
  // Absent = create mode (calls STORY-027's POST); present = edit mode
  // (calls STORY-028's PATCH) — this story's own AC: "Submit calls
  // STORY-027 (create) or STORY-028 (edit) depending on entry point."
  session?: SessionResult;
  onSaved: (session: SessionResult) => void;
  onCancel: () => void;
}

const SessionForm = ({ eventId, session, onSaved, onCancel }: SessionFormProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { isDirty },
  } = useForm<SessionFormValues>({
    defaultValues: toFormValues(session),
  });

  // A 400 here is specifically the end_date/start_date range rejection
  // (STORY-027/STORY-028's own validation) — this story's own AC requires
  // it surface inline on the date fields, not as a generic banner, so
  // onError routes it through setError('endDate', ...) instead of
  // submitError. Any other failure (404 the Session/Event vanished
  // meanwhile) still falls back to the generic banner. Duplicated across
  // both mutations rather than extracted to a shared `unknown`-typed
  // function — each mutation's own onError parameter is already correctly
  // narrowed by ts-rest from its own contract responses, which a shared
  // `unknown` parameter would lose (forcing a cast, typescript-rules rule 1).
  const createMutation = tsr.createSession.useMutation({
    onSuccess: (response) => onSaved(response.body),
    onError: (error) => {
      if (!(error instanceof Error) && error.status === 400) {
        setError('endDate', { message: error.body.error.message });
        return;
      }
      setSubmitError('Something went wrong. Please try again.');
    },
  });
  const updateMutation = tsr.updateSession.useMutation({
    onSuccess: (response) => onSaved(response.body),
    onError: (error) => {
      if (!(error instanceof Error) && error.status === 400) {
        setError('endDate', { message: error.body.error.message });
        return;
      }
      setSubmitError('Something went wrong. Please try again.');
    },
  });
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Auto-fills venue_cost from the lookup table the instant a preset venue
  // is chosen (this story's own AC) — the field stays a perfectly ordinary
  // registered input afterward, so a manual edit right after is never
  // overwritten by anything else on this form.
  const handleVenueOptionChange = (changeEvent: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const lookupValue = VENUE_COST_LOOKUP[changeEvent.target.value];
    if (lookupValue !== undefined) {
      setValue('venueCost', lookupValue);
    }
  };

  const handleSave = handleSubmit((values) => {
    if (isPending) {
      return;
    }
    // Blocked client-side before ever reaching the server (this story's own
    // edge case) — plain string comparison, since 'YYYY-MM-DD' values sort
    // lexicographically the same as chronologically; no Date construction.
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      setError('endDate', { message: 'End date must be on or after start date.' });
      return;
    }
    clearErrors('endDate');
    setSubmitError(null);

    const sessionType =
      values.sessionTypeOption === CUSTOM_SESSION_TYPE_OPTION
        ? values.sessionTypeCustom.trim()
        : values.sessionTypeOption;
    const venue = values.venueOption === CUSTOM_VENUE_OPTION ? values.venueCustom.trim() : values.venueOption;

    const body = {
      sessionType,
      venue,
      venueCost: values.venueCost,
      startDate: values.startDate,
      endDate: values.endDate,
      startTime: values.startTime.trim() || undefined,
      endTime: values.endTime.trim() || undefined,
      pax: values.pax,
      setup: {
        seating: values.setup.seating || undefined,
        tableCount: values.setup.tableCount,
        chairCount: values.setup.chairCount,
        stage: values.setup.stage,
        buffet: values.setup.buffet,
        registrationDesk: values.setup.registrationDesk,
        vipSeating: values.setup.vipSeating,
        brideGroomSeating: values.setup.brideGroomSeating,
        notes: values.setup.notes.trim() || undefined,
      },
    };

    if (session) {
      updateMutation.mutate({ params: { id: eventId, sid: session.id }, body });
    } else {
      createMutation.mutate({ params: { id: eventId }, body });
    }
  });

  return (
    <Stack component="form" onSubmit={handleSave} noValidate sx={formStyles}>
      <Typography variant="titleM" component="h2">
        {session ? 'Edit Session' : 'Add Session'}
      </Typography>
      {/* Session type/Venue/Venue cost/Pax grouped in one wrapped row —
          matches event-details-step.tsx's own entry-form grouping, so the
          Sessions tab's Add/Edit form lays out fields the same way the
          wizard's own Session-entry form already does. */}
      <Stack direction="row" sx={rowStyles}>
        <Controller
          name="sessionTypeOption"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Session type" sx={{ minWidth: 200 }}>
              {SESSION_TYPE_PRESETS.map((preset) => (
                <MenuItem key={preset} value={preset}>
                  {preset}
                </MenuItem>
              ))}
              <MenuItem value={CUSTOM_SESSION_TYPE_OPTION}>{CUSTOM_SESSION_TYPE_OPTION}</MenuItem>
            </TextField>
          )}
        />
        <Controller
          name="venueOption"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Venue"
              sx={{ minWidth: 200 }}
              onChange={(changeEvent) => {
                field.onChange(changeEvent);
                handleVenueOptionChange(changeEvent);
              }}
            >
              {VENUE_PRESETS.map((preset) => (
                <MenuItem key={preset} value={preset}>
                  {preset}
                </MenuItem>
              ))}
              <MenuItem value={CUSTOM_VENUE_OPTION}>{CUSTOM_VENUE_OPTION}</MenuItem>
            </TextField>
          )}
        />
        <TextField
          {...register('venueCost', { valueAsNumber: true })}
          label="Venue cost"
          type="number"
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
      {/* StaticTimePicker (STORY-057) — the always-visible clock face SRS
          §6.9 calls for, not TimePicker's popover-only one, with an explicit
          AM/PM control (`ampm`). No floating label of its own, unlike
          TextField, so each gets a plain heading instead. */}
      <Stack direction="row" sx={rowStyles}>
        <Stack sx={timeFieldStyles}>
          <Typography variant="titleM" component="h3" id="session-start-time-label">
            Start time
          </Typography>
          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <StaticTimePicker
                ampm
                value={toPickerTime(field.value)}
                onChange={(time) => field.onChange(fromPickerTime(time))}
              />
            )}
          />
        </Stack>
        <Stack sx={timeFieldStyles}>
          <Typography variant="titleM" component="h3" id="session-end-time-label">
            End time
          </Typography>
          <Controller
            name="endTime"
            control={control}
            render={({ field }) => (
              <StaticTimePicker
                ampm
                value={toPickerTime(field.value)}
                onChange={(time) => field.onChange(fromPickerTime(time))}
              />
            )}
          />
        </Stack>
      </Stack>
      <Stack sx={setupCardStyles}>
        <Typography variant="titleM" component="h3">
          Setup
        </Typography>
        <Controller
          name="setup.seating"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Seating" fullWidth>
              <MenuItem value="">Not set</MenuItem>
              {SEATING_ARRANGEMENT_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {SEATING_ARRANGEMENT_LABELS[option]}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Stack direction="row" sx={rowStyles}>
          <TextField
            {...register('setup.tableCount', { valueAsNumber: true })}
            label="Tables"
            type="number"
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <TextField
            {...register('setup.chairCount', { valueAsNumber: true })}
            label="Chairs"
            type="number"
            slotProps={{ htmlInput: { min: 0 } }}
          />
        </Stack>
        <Stack direction="row" sx={rowStyles}>
          {(
            [
              ['stage', 'Stage'],
              ['buffet', 'Buffet'],
              ['registrationDesk', 'Registration desk'],
              ['vipSeating', 'VIP seating'],
              ['brideGroomSeating', 'Bride/Groom seating'],
            ] as const
          ).map(([key, label]) => (
            <Controller
              key={key}
              name={`setup.${key}`}
              control={control}
              render={({ field }) => (
                <ToggleButton
                  value={key}
                  selected={field.value}
                  onChange={() => field.onChange(!field.value)}
                  sx={field.value ? toggleActiveStyles : undefined}
                >
                  <Typography variant="labelS">{label}</Typography>
                </ToggleButton>
              )}
            />
          ))}
        </Stack>
        <TextField {...register('setup.notes')} label="Notes" multiline minRows={2} fullWidth />
      </Stack>
      {submitError && (
        <Alert severity="error">
          <Typography variant="bodyM">{submitError}</Typography>
        </Alert>
      )}
      <Stack direction="row" sx={rowStyles}>
        <Button type="submit" variant="contained" disabled={!isDirty || isPending}>
          {session ? 'Save session' : 'Add session'}
        </Button>
        <Button onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  );
};

export default SessionForm;
