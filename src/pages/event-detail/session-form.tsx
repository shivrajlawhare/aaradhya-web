import { useState, type ChangeEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Button, MenuItem, Stack, TextField, ToggleButton, Typography } from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import { SEATING_ARRANGEMENT_OPTIONS, SeatingArrangement, type eventResultSchema } from '../../contract';
import { toDateInputValue } from './date-input';
import ItemsSection from './items-section';
import {
  CUSTOM_SESSION_TYPE_OPTION,
  CUSTOM_VENUE_OPTION,
  SEATING_ARRANGEMENT_LABELS,
  SESSION_TYPE_PRESETS,
  VENUE_COST_LOOKUP,
  VENUE_PRESETS,
} from './session-form-options';
import { formStyles, rowStyles, setupCardStyles, toggleActiveStyles } from './session-form.styles';

type PublicEvent = z.infer<typeof eventResultSchema>;
type SessionResult = PublicEvent['sessions'][number];

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
      setup: {
        seating: '',
        tableCount: 0,
        chairCount: 0,
        stage: false,
        buffet: false,
        registrationDesk: false,
        vipSeating: false,
        brideGroomSeating: false,
        notes: '',
      },
    };
  }

  const sessionTypeParts = toOptionParts(session.sessionType, SESSION_TYPE_PRESETS, CUSTOM_SESSION_TYPE_OPTION);
  const venueParts = toOptionParts(session.venue, VENUE_PRESETS, CUSTOM_VENUE_OPTION);
  return {
    sessionTypeOption: sessionTypeParts.option,
    sessionTypeCustom: sessionTypeParts.custom,
    venueOption: venueParts.option,
    venueCustom: venueParts.custom,
    venueCost: session.venueCost,
    startDate: toDateInputValue(session.startDate),
    endDate: toDateInputValue(session.endDate),
    startTime: session.startTime ?? '',
    endTime: session.endTime ?? '',
    pax: session.pax,
    setup: {
      seating: session.setup.seating ?? '',
      tableCount: session.setup.tableCount,
      chairCount: session.setup.chairCount,
      stage: session.setup.stage,
      buffet: session.setup.buffet,
      registrationDesk: session.setup.registrationDesk,
      vipSeating: session.setup.vipSeating,
      brideGroomSeating: session.setup.brideGroomSeating,
      notes: session.setup.notes ?? '',
    },
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
  // Refetches the Event so session.items reflects a change made within
  // the Items section below — STORY-033's own Items UI lives inside this
  // form but persists each Item independently of the Session's own Save
  // button (Items have their own POST/PATCH/DELETE, STORY-032). Only
  // used when editing an existing Session (Items need a real :sid).
  onItemsChanged?: () => void;
}

const SessionForm = ({ eventId, session, onSaved, onCancel, onItemsChanged }: SessionFormProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { control, register, handleSubmit, setValue, setError, clearErrors } = useForm<SessionFormValues>({
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
      <Controller
        name="sessionTypeOption"
        control={control}
        render={({ field }) => (
          <TextField {...field} select label="Session type" fullWidth>
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
            fullWidth
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
      <TextField {...register('venueCost', { valueAsNumber: true })} label="Venue cost" type="number" fullWidth />
      <Stack direction="row" sx={rowStyles}>
        <Controller
          name="startDate"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Start date" type="date" slotProps={{ inputLabel: { shrink: true } }} />
          )}
        />
        <Controller
          name="endDate"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="End date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <TextField
          {...register('startTime')}
          label="Start time"
          type="time"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          {...register('endTime')}
          label="End time"
          type="time"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>
      <TextField
        {...register('pax', { valueAsNumber: true })}
        label="Pax"
        type="number"
        slotProps={{ htmlInput: { min: 0 } }}
        fullWidth
      />
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
      {session && onItemsChanged && (
        <ItemsSection eventId={eventId} session={session} onItemsChanged={onItemsChanged} />
      )}
      {submitError && (
        <Alert severity="error">
          <Typography variant="bodyM">{submitError}</Typography>
        </Alert>
      )}
      <Stack direction="row" sx={rowStyles}>
        <Button type="submit" variant="contained" disabled={isPending}>
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
