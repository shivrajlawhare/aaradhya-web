import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Controller, useForm } from 'react-hook-form';
import { tsr } from '../../api/client';
import DepartmentNotesFields, {
  type DepartmentNotesValues,
  EMPTY_DEPARTMENT_NOTES,
} from '../../components/ui/department-notes-fields';
import { getRangeEndDateProps, isEndBeforeStart } from '../../components/ui/range-end-date-props';
import { SEATING_ARRANGEMENT_OPTIONS, SeatingArrangement } from '../../contract';
import { useEventWizard } from '../../stores/event-wizard-context';
import { formatEventDate, formatSessionDuration } from '../../utils/quotation-formatting';
import { enumerateDates, getDistinctDates } from '../../utils/session-dates';
import { fromPickerDate, toPickerDate } from '../event-detail/date-input';
import { SEATING_ARRANGEMENT_LABELS } from '../event-detail/session-form-options';
import {
  addedCardHeaderStyles,
  addedCardIconStyles,
  addedCardLineStyles,
  addedCardStyles,
  addedHeaderStyles,
  addedRowStyles,
  addedSectionStyles,
  cardListStyles,
  costFieldStyles,
  costPaxRowStyles,
  countFieldStyles,
  dateColumnStyles,
  emptyCellStyles,
  emptyTextStyles,
  eventTypeFieldStyles,
  formActionsStyles,
  formCardStyles,
  loadingStyles,
  paxFieldStyles,
  primaryFieldsStyles,
  scheduleStyles,
  seatingFieldStyles,
  setupCardStyles,
  setupFieldsStyles,
  setupToggleStyles,
  summaryStyles,
  tableCardStyles,
  timeFieldStyles,
  toggleRowStyles,
  venueFieldStyles,
  wrapperStyles,
} from './event-details-step.styles';
import TimePickerCard from './time-picker-card';

// A distinct sentinel from any real Event Type Master name — this story's
// own AC: "plus a free-text custom option," same "dropdown + custom"
// convention this app already uses elsewhere (session-form-options.ts's
// own CUSTOM_SESSION_TYPE_OPTION).
const CUSTOM_EVENT_TYPE_OPTION = 'Custom…';

type SetupToggleKey = 'stage' | 'buffet' | 'registrationDesk' | 'vipSeating' | 'brideGroomSeating';

interface SetupToggle {
  key: SetupToggleKey;
  label: string;
}

// The field label sits above the input, so an empty select shows its own
// empty option ("Not set", "Select a venue", …) instead of a blank box.
const SHOW_EMPTY_OPTION = { select: { displayEmpty: true } };

const SETUP_TOGGLES: SetupToggle[] = [
  { key: 'stage', label: 'Stage' },
  { key: 'buffet', label: 'Buffet' },
  { key: 'registrationDesk', label: 'Registration desk' },
  { key: 'vipSeating', label: 'VIP seating' },
  { key: 'brideGroomSeating', label: 'Bride/Groom seating' },
];

// A Session row as this step holds it — field names match
// createSessionBodySchema (contract/index.ts) one-for-one (sessionType,
// venue, venueCost, pax, startDate/endDate, startTime/endTime) since this
// is exactly what STORY-068's eventual POST /events call needs to send;
// nothing here is submitted yet (SRS FR-EVT-8 — held in the wizard store
// until Step 5).
// Optional, not required to add a Session (this story's own AC — Setup
// details get filled in properly in a later version) — mirrors
// session-form.tsx's own SessionFormValues['setup'] shape exactly, field for
// field, so the two Setup cards (wizard and Event Detail's Sessions tab) stay
// in lockstep.
export interface WizardSessionSetup {
  seating: SeatingArrangement | '';
  tableCount: number;
  chairCount: number;
  stage: boolean;
  buffet: boolean;
  registrationDesk: boolean;
  vipSeating: boolean;
  brideGroomSeating: boolean;
  notes: string;
}

export const emptySetup: WizardSessionSetup = {
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
  setup: WizardSessionSetup;
  // DEV-12 (D4). Optional: rows stored before it existed have none.
  departmentNotes?: DepartmentNotesValues;
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
  setup: WizardSessionSetup;
  departmentNotes: DepartmentNotesValues;
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
  setup: emptySetup,
  departmentNotes: EMPTY_DEPARTMENT_NOTES,
};

// A stored row back into entry-card values for editing (DEV-06). A type that
// isn't one of the active Event Types was entered via "Custom…", so it
// reopens as the custom option with its text filled in. Rows stored before
// Setup existed get the empty Setup defaults.
const toEntryFormValues = (row: WizardSessionRow, activeEventTypeNames: string[]): EntryFormValues => {
  const isKnownType = row.sessionType === '' || activeEventTypeNames.includes(row.sessionType);
  return {
    sessionTypeOption: isKnownType ? row.sessionType : CUSTOM_EVENT_TYPE_OPTION,
    sessionTypeCustom: isKnownType ? '' : row.sessionType,
    venue: row.venue,
    venueCost: row.venueCost,
    pax: row.pax,
    startDate: row.startDate,
    endDate: row.endDate,
    startTime: row.startTime,
    endTime: row.endTime,
    setup: { ...emptySetup, ...row.setup },
    departmentNotes: row.departmentNotes ?? EMPTY_DEPARTMENT_NOTES,
  };
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
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

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

  const { control, register, handleSubmit, watch, getValues, setValue, setError, clearErrors, reset } =
    useForm<EntryFormValues>({
      defaultValues: emptyEntry,
    });
  const sessionTypeOption = watch('sessionTypeOption');
  // For the Notes for Department Veg + Non-Veg check.
  const entryPax = watch('pax');
  const entryStartDate = watch('startDate');

  // V5: moving the start past the end clears the end (and its error).
  const handleStartDateChange = (startDate: string, onChange: (value: string) => void) => {
    onChange(startDate);
    if (isEndBeforeStart(startDate, getValues('endDate'))) {
      setValue('endDate', '', { shouldDirty: true });
      clearErrors('endDate');
    }
  };

  const handleVenueChange = (venueName: string) => {
    const selected = activeVenues.find((venue) => venue.name === venueName);
    if (selected) {
      setValue('venueCost', selected.defaultVenueCost);
    }
  };

  // DEV-06: the row currently loaded into the entry card for editing (same
  // model as sessions-items-step.tsx's handleEditCeremonyRow).
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const entryCardRef = useRef<HTMLFormElement>(null);

  // A row whose dates stop covering some day (removed, or edited to other
  // dates) orphans any Step 4 (Sessions & Items) entries made against that
  // day — STORY-067 keys them by every calendar date a Session spans, so a
  // multi-day Session is checked across its whole range. A date still
  // covered by another remaining Session is never touched. Confirms first
  // when entries exist; returns false if the user declines.
  const confirmAndClearOrphanedEntries = (
    previousRow: WizardSessionRow,
    nextRows: WizardSessionRow[],
    action: string
  ): boolean => {
    const remainingDates = new Set(getDistinctDates(nextRows));
    const orphanedDates = enumerateDates(previousRow.startDate, previousRow.endDate).filter(
      (date) => !remainingDates.has(date)
    );

    const sessionsItemsData = data['sessions-items'] as SessionsItemsStoreShape | undefined;
    const datesWithEntries = orphanedDates.filter((date) => (sessionsItemsData?.byDate?.[date] ?? []).length > 0);

    if (datesWithEntries.length === 0) {
      return true;
    }
    const dateList = datesWithEntries.map(formatEventDate).join(', ');
    const verb = datesWithEntries.length > 1 ? 'already have' : 'already has';
    const confirmed = window.confirm(
      `${dateList} ${verb} Sessions & Items entered in Step 4. ${action} this Session will also remove them. Continue?`
    );
    if (!confirmed) {
      return false;
    }
    const remainingByDate = { ...(sessionsItemsData?.byDate ?? {}) };
    for (const date of datesWithEntries) {
      delete remainingByDate[date];
    }
    setStepData('sessions-items', { ...sessionsItemsData, byDate: remainingByDate });
    return true;
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    clearErrors('endDate');
    reset(emptyEntry);
  };

  const handleAddEvent = handleSubmit((values) => {
    // Blocked client-side before this ever becomes a row (this story's own
    // AC) — plain string comparison, since 'YYYY-MM-DD' values sort
    // lexicographically the same as chronologically; matches
    // session-form.tsx's own identical check.
    if (isEndBeforeStart(values.startDate, values.endDate)) {
      setError('endDate', { message: 'End date must be on or after start date.' });
      return;
    }
    clearErrors('endDate');

    const sessionType =
      values.sessionTypeOption === CUSTOM_EVENT_TYPE_OPTION
        ? values.sessionTypeCustom.trim()
        : values.sessionTypeOption;

    const savedRow: WizardSessionRow = {
      id: editingRowId ?? createRowId(),
      sessionType,
      venue: values.venue,
      venueCost: values.venueCost,
      pax: values.pax,
      startDate: values.startDate,
      endDate: values.endDate,
      startTime: values.startTime,
      endTime: values.endTime,
      setup: values.setup,
      departmentNotes: values.departmentNotes,
    };

    const previousRow = rows.find((row) => row.id === editingRowId);
    if (previousRow) {
      // Save replaces the row in place (same position, same id).
      const nextRows = rows.map((row) => (row.id === previousRow.id ? savedRow : row));
      if (!confirmAndClearOrphanedEntries(previousRow, nextRows, 'Moving')) {
        return;
      }
      setRows(nextRows);
    } else {
      setRows((current) => [...current, savedRow]);
    }
    setEditingRowId(null);
    reset(emptyEntry);
  });

  // Loads the row's fields, times and Setup into the entry card.
  const handleEditRow = (row: WizardSessionRow) => {
    setEditingRowId(row.id);
    clearErrors('endDate');
    reset(
      toEntryFormValues(
        row,
        activeEventTypes.map((eventType) => eventType.name)
      )
    );
    entryCardRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };

  // Removing a Session also removes any Step 4 entries it orphans (with a
  // confirmation prompt if any exist). Removing the row being edited also
  // resets the entry card.
  const handleRemoveRow = (row: WizardSessionRow) => {
    const remainingRows = rows.filter((existing) => existing.id !== row.id);
    if (!confirmAndClearOrphanedEntries(row, remainingRows, 'Removing')) {
      return;
    }
    setRows(remainingRows);
    if (editingRowId === row.id) {
      handleCancelEdit();
    }
  };

  const formatRowDate = (row: WizardSessionRow): string =>
    row.startDate === row.endDate || !row.endDate
      ? formatEventDate(row.startDate)
      : `${formatEventDate(row.startDate)} - ${formatEventDate(row.endDate)}`;

  if (isMasterListsLoading) {
    return (
      <Stack sx={loadingStyles}>
        <CircularProgress aria-label="Loading event type and venue options" />
      </Stack>
    );
  }

  const isEditing = editingRowId !== null;
  let submitLabel = 'Add Event';
  if (isEditing) {
    submitLabel = 'Save Event';
  }
  const totalGuests = rows.reduce((sum, row) => sum + (Number.isFinite(row.pax) ? row.pax : 0), 0);
  const summary = `${rows.length} ${rows.length === 1 ? 'event' : 'events'} · ${totalGuests} guests`;

  const handleRowKeyDown = (event: KeyboardEvent<HTMLElement>, row: WizardSessionRow) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleEditRow(row);
    }
  };

  const removeButton = (row: WizardSessionRow) => (
    <IconButton
      aria-label={`Remove ${row.sessionType || 'event'} row`}
      size="small"
      onClick={(event) => {
        event.stopPropagation();
        handleRemoveRow(row);
      }}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );

  let addedEvents: ReactNode;
  if (isDesktop) {
    addedEvents = (
      <Paper elevation={0} sx={tableCardStyles}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Event Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Guests</TableCell>
              <TableCell>Venue</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={emptyCellStyles}>
                  No Sessions yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow
                key={row.id}
                hover
                tabIndex={0}
                aria-selected={row.id === editingRowId}
                onClick={() => handleEditRow(row)}
                onKeyDown={(event) => handleRowKeyDown(event, row)}
                sx={addedRowStyles(row.id === editingRowId)}
              >
                <TableCell>{row.sessionType}</TableCell>
                <TableCell>{formatRowDate(row)}</TableCell>
                <TableCell>{formatSessionDuration(row.startTime, row.endTime)}</TableCell>
                <TableCell>{row.pax}</TableCell>
                <TableCell>{row.venue}</TableCell>
                <TableCell align="right">{row.venueCost}</TableCell>
                <TableCell padding="checkbox">{removeButton(row)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    );
  } else {
    addedEvents = (
      <Stack sx={cardListStyles}>
        {rows.length === 0 && (
          <Typography variant="bodyM" sx={emptyTextStyles}>
            No Sessions yet.
          </Typography>
        )}
        {rows.map((row) => (
          <Box
            key={row.id}
            role="button"
            tabIndex={0}
            aria-pressed={row.id === editingRowId}
            onClick={() => handleEditRow(row)}
            onKeyDown={(event) => handleRowKeyDown(event, row)}
            sx={addedCardStyles(row.id === editingRowId)}
          >
            <Box sx={addedCardHeaderStyles}>
              <Typography variant="titleS" component="p">
                {row.sessionType}
              </Typography>
              {removeButton(row)}
            </Box>
            <Box sx={addedCardLineStyles}>
              <CalendarTodayOutlinedIcon aria-hidden sx={addedCardIconStyles} />
              <Typography variant="bodyS" component="span">
                {formatRowDate(row)} · {formatSessionDuration(row.startTime, row.endTime)}
              </Typography>
            </Box>
            <Box sx={addedCardLineStyles}>
              <PlaceOutlinedIcon aria-hidden sx={addedCardIconStyles} />
              <Typography variant="bodyS" component="span">
                {row.venue} · {row.pax} guests · {row.venueCost}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <Stack sx={wrapperStyles}>
      <Paper elevation={0} component="form" ref={entryCardRef} onSubmit={handleAddEvent} sx={formCardStyles}>
        <Typography variant="h3" component="h2">
          Event Details
        </Typography>
        <Box sx={primaryFieldsStyles}>
          <Controller
            name="sessionTypeOption"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Event Type" slotProps={SHOW_EMPTY_OPTION} sx={eventTypeFieldStyles}>
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
            <TextField {...register('sessionTypeCustom')} label="Custom event type" sx={eventTypeFieldStyles} />
          )}
          <Controller
            name="venue"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Venue"
                slotProps={SHOW_EMPTY_OPTION}
                sx={venueFieldStyles}
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
          <Box sx={costPaxRowStyles}>
            <TextField
              {...register('venueCost', { valueAsNumber: true })}
              label="Venue Cost"
              type="number"
              slotProps={{
                htmlInput: { min: 0 },
                input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
              }}
              sx={costFieldStyles}
            />
            <TextField
              {...register('pax', { valueAsNumber: true })}
              label="Pax"
              type="number"
              slotProps={{ htmlInput: { min: 0 } }}
              sx={paxFieldStyles}
            />
          </Box>
        </Box>
        <Box sx={scheduleStyles}>
          <Stack sx={dateColumnStyles}>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Start date"
                  value={toPickerDate(field.value)}
                  onChange={(date) => handleStartDateChange(fromPickerDate(date), field.onChange)}
                  slotProps={{ textField: { onBlur: field.onBlur, fullWidth: true } }}
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
                  {...getRangeEndDateProps(entryStartDate)}
                  slotProps={{
                    textField: {
                      onBlur: field.onBlur,
                      fullWidth: true,
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
          <Stack sx={timeFieldStyles}>
            <Typography variant="titleM" component="h3">
              Start time
            </Typography>
            <Controller
              name="startTime"
              control={control}
              render={({ field }) => <TimePickerCard value={field.value} onChange={field.onChange} />}
            />
          </Stack>
          <Stack sx={timeFieldStyles}>
            <Typography variant="titleM" component="h3">
              End time
            </Typography>
            <Controller
              name="endTime"
              control={control}
              render={({ field }) => <TimePickerCard value={field.value} onChange={field.onChange} />}
            />
          </Stack>
        </Box>
        {/* Setup — optional, not required to add a Session (this story's own
            AC: filled in properly in a later version). Mirrors
            session-form.tsx's own "Setup" card field-for-field so the Event
            Detail Sessions tab's Edit flow doesn't ask for anything new this
            step didn't already offer. */}
        <Stack sx={setupCardStyles}>
          <Typography variant="titleM" component="h3">
            Setup
          </Typography>
          <Box sx={setupFieldsStyles}>
            <Controller
              name="setup.seating"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Seating" slotProps={SHOW_EMPTY_OPTION} sx={seatingFieldStyles}>
                  <MenuItem value="">Not set</MenuItem>
                  {SEATING_ARRANGEMENT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {SEATING_ARRANGEMENT_LABELS[option]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField
              {...register('setup.tableCount', { valueAsNumber: true })}
              label="Tables"
              type="number"
              slotProps={{ htmlInput: { min: 0 } }}
              sx={countFieldStyles}
            />
            <TextField
              {...register('setup.chairCount', { valueAsNumber: true })}
              label="Chairs"
              type="number"
              slotProps={{ htmlInput: { min: 0 } }}
              sx={countFieldStyles}
            />
          </Box>
          <Box sx={toggleRowStyles}>
            {SETUP_TOGGLES.map(({ key, label }) => (
              <Controller
                key={key}
                name={`setup.${key}`}
                control={control}
                render={({ field }) => (
                  <ToggleButton
                    value={key}
                    selected={field.value}
                    onChange={() => field.onChange(!field.value)}
                    sx={setupToggleStyles}
                  >
                    <Typography variant="labelM" component="span">
                      {label}
                    </Typography>
                  </ToggleButton>
                )}
              />
            ))}
          </Box>
          <TextField {...register('setup.notes')} label="Notes" multiline minRows={3} fullWidth />
        </Stack>
        <Controller
          name="departmentNotes"
          control={control}
          render={({ field }) => <DepartmentNotesFields value={field.value} pax={entryPax} onChange={field.onChange} />}
        />
        <Box sx={formActionsStyles}>
          <Button type="submit" variant="contained" startIcon={<AddIcon />}>
            {submitLabel}
          </Button>
          {isEditing && (
            <Button variant="ghost" onClick={handleCancelEdit}>
              Cancel edit
            </Button>
          )}
        </Box>
      </Paper>

      <Stack component="section" aria-label="Added events" sx={addedSectionStyles}>
        <Box sx={addedHeaderStyles}>
          <Typography variant="h3" component="h2">
            Added events
          </Typography>
          <Typography variant="bodyS" sx={summaryStyles}>
            {summary}
          </Typography>
        </Box>
        {addedEvents}
      </Stack>
    </Stack>
  );
};

export default EventDetailsStep;
