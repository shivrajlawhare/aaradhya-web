import { Fragment, useEffect, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Button,
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
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { tsr } from '../../api/client';
import { ClientContactRole, ItemType } from '../../contract';
import { quotationPreviewPath } from '../../routes';
import { useAuth } from '../../stores/auth-context';
import { useEventWizard } from '../../stores/event-wizard-context';
import { formatAmount } from '../event-detail/format-amount';
import { computeTotalDays } from '../../utils/accommodation-calculations';
import { enumerateDates } from '../../utils/session-dates';
import { computeWizardTotalCostSummary, type ManualLineItem } from '../../utils/total-cost-summary';
import type { WizardRoomLine } from './accommodation-step';
import type { WizardContactRow } from './client-details-step';
import type { WizardSessionRow } from './event-details-step';
import type { WizardDateEntry } from './sessions-items-step';
import {
  addButtonStyles,
  amountFieldStyles,
  dateBlockHeaderStyles,
  eventTypeCardStyles,
  gstFieldStyles,
  inlineRowStyles,
  manualItemAmountCellStyles,
  manualItemNameCellStyles,
  manualItemNoteStyles,
  manualItemsCardStyles,
  noteFieldStyles,
  numericCellStyles,
  optionFieldStyles,
  optionRowStyles,
  shadedCellStyles,
  shadedRowStyles,
  submittingNoteStyles,
  summaryCardStyles,
  wrapperStyles,
} from './review-step.styles';

// No master list backs this, and no earlier wizard step collects it — the
// old (STORY-063-deleted) single-page form had its own Event Family Type
// picker, and nothing in Steps 1-4 replaced it. Same "dropdown + custom"
// convention every other free-text field in this app uses; defaults to a
// smart guess (the last Session's own sessionType — both reference
// quotations' overall theme matches their final, culminating Session) so
// most Event Managers never need to touch it, while still seeing and being
// able to correct it before submitting.
const EVENT_FAMILY_TYPE_PRESETS = ['Wedding', 'Engagement', 'Corporate', 'Birthday'];
const CUSTOM_EVENT_FAMILY_TYPE_OPTION = 'Custom…';

const DEFAULT_GST_PERCENT = 5;

interface ClientDetailsShape {
  contacts: WizardContactRow[];
}

const isClientDetailsShape = (value: unknown): value is ClientDetailsShape =>
  typeof value === 'object' && value !== null && Array.isArray((value as ClientDetailsShape).contacts);

interface EventDetailsShape {
  sessions: WizardSessionRow[];
}

const isEventDetailsShape = (value: unknown): value is EventDetailsShape =>
  typeof value === 'object' && value !== null && Array.isArray((value as EventDetailsShape).sessions);

interface AccommodationShape {
  checkInDate: string;
  checkOutDate: string;
  roomLines: WizardRoomLine[];
}

const isAccommodationShape = (value: unknown): value is AccommodationShape =>
  typeof value === 'object' && value !== null && Array.isArray((value as AccommodationShape).roomLines);

interface SessionsItemsShape {
  byDate: Record<string, WizardDateEntry[]>;
}

const isSessionsItemsShape = (value: unknown): value is SessionsItemsShape =>
  typeof value === 'object' && value !== null && typeof (value as SessionsItemsShape).byDate === 'object';

interface ReviewStepData {
  eventFamilyTypeOption: string;
  eventFamilyTypeCustom: string;
  gstPercent: number;
  manualLineItems: ManualLineItem[];
  // Mirrored into the wizard store (not just local state) so
  // wizard-step-readiness.ts's own 'review' entry can disable the shared
  // footer's "Generate Quotation" button while a submission is in flight,
  // the same registry every other step's own Next-disabled state already
  // goes through — no separate prop needs threading down for it.
  isSubmitting: boolean;
}

const isReviewStepData = (value: unknown): value is ReviewStepData =>
  typeof value === 'object' && value !== null && Array.isArray((value as ReviewStepData).manualLineItems);

const toEventFamilyTypeOption = (guess: string): { option: string; custom: string } => {
  if (!guess) {
    return { option: '', custom: '' };
  }
  if (EVENT_FAMILY_TYPE_PRESETS.includes(guess)) {
    return { option: guess, custom: '' };
  }
  return { option: CUSTOM_EVENT_FAMILY_TYPE_OPTION, custom: guess };
};

const createRowId = (): string => `line-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const roleForContactRow = (row: WizardContactRow): ClientContactRole => {
  if (row.id === 'bride') {
    return ClientContactRole.Bride;
  }
  if (row.id === 'groom') {
    return ClientContactRole.Groom;
  }
  if (row.id === 'poc') {
    return ClientContactRole.POC;
  }
  // A custom row's own free-text roleLabel has no slot on the backend's
  // closed ClientContactRole enum — dropped here, the same lossy-but-
  // unavoidable mapping client-details-step.tsx's own top comment already
  // flags as "reconciling this shape... is STORY-068's own job".
  return ClientContactRole.Custom;
};

const mapClientContacts = (rows: WizardContactRow[]) =>
  rows
    // The backend's own clientContactSchema requires both a non-blank name
    // AND a non-blank contactNumber per row — client-details-step.tsx
    // itself never enforces that ("every field is optional, Next always
    // enables"), so a name-only row must be dropped here too, not just a
    // fully-blank one, or it reaches the server as an otherwise-silent 400.
    .filter((row) => row.name.trim() !== '' && row.contactNumber.trim() !== '')
    .map((row) => ({ name: row.name.trim(), contactNumber: row.contactNumber.trim(), role: roleForContactRow(row) }));

type MappedSessionItem =
  | {
      type: ItemType.Meal;
      mealName: string;
      pax: number;
      costPerPlate: number;
      limitedSeating: boolean;
      menuItems: { id: string }[];
      startTime: string | undefined;
      endTime: string | undefined;
    }
  | { type: ItemType.Event; eventName: string; venue: string; startTime: string | undefined; endTime: string | undefined };

const mapSessionItem = (entry: WizardDateEntry, venue: string): MappedSessionItem => {
  if (entry.type === ItemType.Meal) {
    return {
      type: ItemType.Meal,
      mealName: entry.mealName,
      pax: entry.pax,
      costPerPlate: entry.costPerPlate,
      limitedSeating: entry.limitedSeating,
      // Every chip already carries a real Menu Item id by this point —
      // sessions-items-step.tsx's own resolveMenuItemChips persists a
      // not-yet-existing name for real the moment a Food/Dining row is
      // added, so nothing here needs the { name } find-or-create shape.
      menuItems: entry.menuItems.map((chip) => ({ id: chip.id })),
      startTime: entry.startTime.trim() || undefined,
      endTime: entry.endTime.trim() || undefined,
    };
  }
  return {
    type: ItemType.Event,
    eventName: entry.eventName,
    // Ceremony Events have no venue field of their own (this story's own
    // AC, sessions-items-step.tsx's own WizardCeremonyItem comment) —
    // defaulted here from the owning Session's own venue.
    venue,
    startTime: entry.startTime.trim() || undefined,
    endTime: entry.endTime.trim() || undefined,
  };
};

// Each date's Sessions & Items entries are assigned to the first Session
// (in entry order) that covers that date — byDate itself isn't keyed by
// Session, only by date (sessions-items-step.tsx's own design, since more
// than one Session can cover the same date), so a deterministic owner has
// to be chosen for the backend's own "an Item belongs to exactly one
// Session" shape (SRS §4.5). A date already claimed by an earlier Session
// is never assigned to a second one.
const mapSessionsForSubmit = (sessions: WizardSessionRow[], byDate: Record<string, WizardDateEntry[]>) => {
  const usedDates = new Set<string>();
  return sessions.map((session) => {
    const items: MappedSessionItem[] = [];
    for (const date of enumerateDates(session.startDate, session.endDate)) {
      if (usedDates.has(date)) {
        continue;
      }
      usedDates.add(date);
      for (const entry of byDate[date] ?? []) {
        items.push(mapSessionItem(entry, session.venue));
      }
    }
    return {
      sessionType: session.sessionType,
      venue: session.venue,
      venueCost: session.venueCost,
      startDate: session.startDate,
      endDate: session.endDate,
      startTime: session.startTime.trim() || undefined,
      endTime: session.endTime.trim() || undefined,
      pax: session.pax,
      items,
    };
  });
};

const mapAccommodationForSubmit = (accommodation: AccommodationShape | undefined) => {
  if (!accommodation || !accommodation.checkInDate || !accommodation.checkOutDate) {
    return undefined;
  }
  return {
    checkIn: accommodation.checkInDate,
    checkOut: accommodation.checkOutDate,
    // Drops the wizard-only id/locked fields (accommodation-step.tsx's own
    // WizardRoomLine) — the backend's roomLineSchema only ever wants these
    // four.
    roomLines: accommodation.roomLines.map(({ roomType, occupancy, tariff, noOfRooms }) => ({
      roomType,
      occupancy,
      tariff,
      noOfRooms,
    })),
  };
};

interface ManualItemFormValues {
  name: string;
  note: string;
  amount: number;
}

const emptyManualItem: ManualItemFormValues = { name: '', note: '', amount: 0 };

interface ReviewStepProps {
  // event-wizard-shell.tsx's own onNext hook is wired at the route level
  // (app.tsx), one layer above this component's own EventWizardProvider —
  // that layer has no access to this step's local state (manual line
  // items, the GST% field, the Event Type picker), so this step instead
  // registers its own submit handler up into a ref app.tsx already holds,
  // re-registering on every render so the ref always calls the latest
  // closure by the time the shared footer's button is actually clicked.
  registerSubmit: (submit: () => void) => void;
}

// Wizard Step 5 (STORY-068). A live Total Cost Summary computed from every
// prior step's own wizard-store data (no Event exists yet to ask the
// server for it, SRS FR-EVT-8) plus this step's own manual line items and
// editable GST%; "Generate Quotation" submits everything as one POST
// /events call, then navigates to the Quotation Preview screen for the
// newly-created Event.
const ReviewStep = ({ registerSubmit }: ReviewStepProps) => {
  const { data, setStepData, clearWizard } = useEventWizard();
  const { user } = useAuth();
  const navigate = useNavigate();

  const clientDetailsData = data['client-details'];
  const contactRows = isClientDetailsShape(clientDetailsData) ? clientDetailsData.contacts : [];

  const eventDetailsData = data['event-details'];
  const sessions = isEventDetailsShape(eventDetailsData) ? eventDetailsData.sessions : [];

  const accommodationData = data['accommodation'];
  const accommodation = isAccommodationShape(accommodationData) ? accommodationData : undefined;

  const sessionsItemsData = data['sessions-items'];
  const byDate = isSessionsItemsShape(sessionsItemsData) ? sessionsItemsData.byDate : {};

  // Same "check-out before check-in is invalid, fall back rather than let
  // total_days go negative" guard accommodation-step.tsx's own
  // isRangeInvalid already applies — this step trusts Step 3's own gate to
  // block Next on an invalid range in the normal flow, but deep-linking
  // straight to Review (this story's own AC: "deep-linking works") can
  // reach here with a stale invalid range never corrected.
  const isAccommodationRangeInvalid = Boolean(
    accommodation && accommodation.checkInDate && accommodation.checkOutDate && accommodation.checkOutDate < accommodation.checkInDate,
  );
  const accommodationTotalDays =
    (accommodation && !isAccommodationRangeInvalid
      ? computeTotalDays(accommodation.checkInDate, accommodation.checkOutDate)
      : null) ?? 1;

  const stored = data['review'];
  const restored = isReviewStepData(stored) ? stored : undefined;

  const defaultEventType = toEventFamilyTypeOption(sessions[sessions.length - 1]?.sessionType ?? '');
  const [eventFamilyTypeOption, setEventFamilyTypeOption] = useState(
    () => restored?.eventFamilyTypeOption ?? defaultEventType.option,
  );
  const [eventFamilyTypeCustom, setEventFamilyTypeCustom] = useState(
    () => restored?.eventFamilyTypeCustom ?? defaultEventType.custom,
  );
  const [gstPercent, setGstPercent] = useState(() => restored?.gstPercent ?? DEFAULT_GST_PERCENT);
  const [manualLineItems, setManualLineItems] = useState<ManualLineItem[]>(() => restored?.manualLineItems ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // The synchronous double-submission guard handleGenerateQuotation's own
  // comment documents — isSubmitting (state) exists for the UI/readiness
  // registry, this ref exists for the guard itself.
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setStepData('review', { eventFamilyTypeOption, eventFamilyTypeCustom, gstPercent, manualLineItems, isSubmitting });
  }, [eventFamilyTypeOption, eventFamilyTypeCustom, gstPercent, manualLineItems, isSubmitting, setStepData]);

  const manualItemForm = useForm<ManualItemFormValues>({ defaultValues: emptyManualItem });

  const handleAddManualItem = manualItemForm.handleSubmit((values) => {
    setManualLineItems((current) => [
      ...current,
      {
        id: createRowId(),
        name: values.name.trim(),
        note: values.note.trim(),
        amount: Number.isFinite(values.amount) ? values.amount : 0,
      },
    ]);
    manualItemForm.reset(emptyManualItem);
  });

  const handleRemoveManualItem = (id: string) => {
    setManualLineItems((current) => current.filter((item) => item.id !== id));
  };

  const summary = computeWizardTotalCostSummary({
    sessions,
    byDate,
    roomLines: accommodation?.roomLines ?? [],
    accommodationTotalDays,
    gstPercent: Number.isFinite(gstPercent) ? gstPercent : 0,
    manualLineItems,
  });

  const createEventMutation = tsr.createEvent.useMutation({
    onSuccess: (response) => {
      clearWizard();
      navigate(quotationPreviewPath(response.body.id));
    },
    onError: () => {
      isSubmittingRef.current = false;
      setSubmitError('Something went wrong creating the Event. Please try again.');
      setIsSubmitting(false);
    },
  });

  // Aborts validation and resets both the synchronous guard and the
  // (async, UI-facing) isSubmitting state together — every early-return
  // path below goes through this instead of resetting each one by hand.
  const failSubmission = (message: string) => {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    setSubmitError(message);
  };

  const handleGenerateQuotation = () => {
    // A ref, not the isSubmitting state — two clicks fired before React
    // commits the isSubmitting=true update (and before this step's own
    // un-conditioned effect re-registers app.tsx's ref with a fresh
    // closure) would otherwise both read isSubmitting as still false and
    // both proceed, firing two POST /events calls. A ref reads and writes
    // synchronously, so the second click's own invocation of this exact
    // function sees the flip immediately.
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    const contacts = mapClientContacts(contactRows);
    if (contacts.length === 0) {
      failSubmission(
        'Add at least one Client Contact with both a name and a contact number in Step 1 before generating the quotation.',
      );
      return;
    }
    if (sessions.length === 0) {
      failSubmission('Add at least one Session in Step 2 before generating the quotation.');
      return;
    }
    const eventFamilyType =
      eventFamilyTypeOption === CUSTOM_EVENT_FAMILY_TYPE_OPTION ? eventFamilyTypeCustom.trim() : eventFamilyTypeOption;
    if (!eventFamilyType) {
      failSubmission('Choose an Event Type before generating the quotation.');
      return;
    }
    if (!user) {
      failSubmission('Your session has expired. Please log in again.');
      return;
    }

    createEventMutation.mutate({
      body: {
        eventFamilyType,
        eventManager: user.id,
        clientContacts: contacts,
        sessions: mapSessionsForSubmit(sessions, byDate),
        accommodation: mapAccommodationForSubmit(accommodation),
        extraLineItems: manualLineItems.map(({ name, note, amount }) => ({ name, note: note.trim() || undefined, amount })),
      },
    });
  };

  // Re-registers every render (cheap — an assignment, not real work) so
  // the ref app.tsx calls on "Generate Quotation" always reaches this
  // render's own up-to-date closure over local state, never a stale one.
  useEffect(() => {
    registerSubmit(handleGenerateQuotation);
  });

  return (
    <Stack sx={wrapperStyles}>
      <Paper elevation={0} sx={eventTypeCardStyles}>
        <Typography variant="titleM" component="h2">
          Event Type
        </Typography>
        <Stack direction="row" sx={optionRowStyles}>
          <TextField
            select
            label="Event Type"
            value={eventFamilyTypeOption}
            onChange={(event) => setEventFamilyTypeOption(event.target.value)}
            sx={optionFieldStyles}
          >
            <MenuItem value="">Select an event type</MenuItem>
            {EVENT_FAMILY_TYPE_PRESETS.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
            <MenuItem value={CUSTOM_EVENT_FAMILY_TYPE_OPTION}>{CUSTOM_EVENT_FAMILY_TYPE_OPTION}</MenuItem>
          </TextField>
          {eventFamilyTypeOption === CUSTOM_EVENT_FAMILY_TYPE_OPTION && (
            <TextField
              label="Custom event type"
              value={eventFamilyTypeCustom}
              onChange={(event) => setEventFamilyTypeCustom(event.target.value)}
              sx={optionFieldStyles}
            />
          )}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={summaryCardStyles}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="labelS">Sub Cost Item</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="labelS">Pax</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="labelS">Cost per Plate</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="labelS">Total Cost</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="labelS">Total Cost with GST</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summary.dateBlocks.map((block) => (
              <Fragment key={block.date}>
                <TableRow sx={dateBlockHeaderStyles}>
                  <TableCell colSpan={5}>
                    <Typography variant="titleM" component="h3">
                      {block.dateLabel}
                    </Typography>
                  </TableCell>
                </TableRow>
                {block.venueRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell sx={numericCellStyles}>{formatAmount(row.amount)}</TableCell>
                  </TableRow>
                ))}
                {block.foodRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell sx={numericCellStyles}>{row.paxDisplay}</TableCell>
                    <TableCell sx={numericCellStyles}>{formatAmount(row.costPerPlate)}</TableCell>
                    <TableCell sx={numericCellStyles}>{formatAmount(row.totalCost)}</TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </Fragment>
            ))}

            <TableRow sx={shadedRowStyles}>
              <TableCell>
                <Stack direction="row" sx={inlineRowStyles}>
                  <Typography variant="labelS" sx={shadedCellStyles}>
                    Food Cost
                  </Typography>
                  <TextField
                    label="GST %"
                    type="number"
                    size="small"
                    value={gstPercent}
                    onChange={(event) => setGstPercent(event.target.value === '' ? 0 : Number(event.target.value))}
                    sx={gstFieldStyles}
                    slotProps={{ htmlInput: { min: 0 } }}
                  />
                </Stack>
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell sx={shadedCellStyles}>{formatAmount(summary.foodCostTotal)}</TableCell>
              <TableCell sx={shadedCellStyles}>{formatAmount(summary.foodCostWithGst)}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>
                <Typography variant="bodyM">Accommodation</Typography>
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell sx={numericCellStyles}>{formatAmount(summary.accommodationTotal)}</TableCell>
            </TableRow>

            {summary.manualLineItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Stack sx={manualItemNameCellStyles}>
                    <Typography variant="bodyM">{item.name}</Typography>
                    {item.note && (
                      <Typography variant="bodyM" sx={manualItemNoteStyles}>
                        {item.note}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell sx={numericCellStyles}>
                  <Stack direction="row" sx={manualItemAmountCellStyles}>
                    {formatAmount(item.amount)}
                    <IconButton
                      aria-label={`Remove ${item.name} line item`}
                      size="small"
                      onClick={() => handleRemoveManualItem(item.id)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}

            <TableRow sx={shadedRowStyles}>
              <TableCell colSpan={3}>
                <Typography variant="labelS" sx={shadedCellStyles}>
                  Grand Total
                </Typography>
              </TableCell>
              <TableCell />
              <TableCell sx={shadedCellStyles}>{formatAmount(Math.round(summary.grandTotal))}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>

      <Paper elevation={0} component="form" onSubmit={handleAddManualItem} sx={manualItemsCardStyles}>
        <Typography variant="titleM" component="h2">
          Add Line Item
        </Typography>
        <Stack direction="row" sx={optionRowStyles}>
          <TextField {...manualItemForm.register('name')} label="Name" sx={optionFieldStyles} />
          <TextField {...manualItemForm.register('note')} label="Note (optional)" sx={noteFieldStyles} />
          <TextField
            {...manualItemForm.register('amount', { valueAsNumber: true })}
            label="Total Cost with GST"
            type="number"
            slotProps={{ htmlInput: { min: 0 } }}
            sx={amountFieldStyles}
          />
        </Stack>
        <Button type="submit" variant="contained" startIcon={<AddIcon />} sx={addButtonStyles}>
          Add Line Item
        </Button>
      </Paper>

      {submitError && (
        <Alert severity="error">
          <Typography variant="bodyM">{submitError}</Typography>
        </Alert>
      )}
      {isSubmitting && (
        <Typography variant="bodyM" sx={submittingNoteStyles}>
          Creating the Event…
        </Typography>
      )}
    </Stack>
  );
};

export default ReviewStep;
