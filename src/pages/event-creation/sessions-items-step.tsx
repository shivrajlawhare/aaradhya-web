import { useEffect, useMemo, useState, type ReactNode } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import { Controller, useForm } from 'react-hook-form';
import { tsr } from '../../api/client';
import { ItemType } from '../../contract';
import { fromPickerTime, toPickerTime } from '../event-detail/date-input';
import { formatAmount } from '../event-detail/format-amount';
import MenuItemSearch, { type MenuItemChip } from '../event-detail/menu-item-search';
import { useEventWizard } from '../../stores/event-wizard-context';
import { formatEventDate, formatQuotationPax, formatSessionDuration } from '../../utils/quotation-formatting';
import { getDistinctDates } from '../../utils/session-dates';
import type { WizardSessionRow } from './event-details-step';
import {
  addButtonStyles,
  lsLabelStyles,
  lsSwitchStyles,
  lsToggleRowStyles,
  miniFieldLabelStyles,
  optionFieldStyles,
  paxRowStyles,
  previewLineStyles,
  reminderStyles,
  rowCardEditingStyles,
  rowCardStyles,
  rowListStyles,
  rowStyles,
  sectionCardStyles,
  timeFieldStyles,
  wrapperStyles,
} from './sessions-items-step.styles';

// A distinct sentinel from any real preset — same "dropdown + custom"
// convention this app already uses everywhere else (event-details-step.tsx's
// own CUSTOM_EVENT_TYPE_OPTION). No master list backs either of these two
// lists (unlike Venue/EventType/RoomType, STORY-061) — the SRS names no
// fixed list for either, so these presets are the same "illustrative
// placeholder until confirmed" the app already accepted for
// session-form-options.ts's own VENUE_COST_LOOKUP, drawn from the SRS's own
// §4.7f worked examples ("Muhurta", "Engagement Sangeet").
const CEREMONY_EVENT_NAME_PRESETS = ['Muhurta', 'Engagement Sangeet', 'Cake Cutting'];
const CUSTOM_CEREMONY_EVENT_OPTION = 'Custom…';
const MEAL_NAME_PRESETS = ['Breakfast', 'Lunch', 'Hi-Tea', 'Dinner'];
const CUSTOM_MEAL_NAME_OPTION = 'Custom…';

// Field names match createItemBodySchema's own Event-variant one-for-one
// (contract/index.ts) — ready for STORY-068's eventual per-Session POST,
// same reasoning event-details-step.tsx's own WizardSessionRow documents.
// No `venue` field — this story's own AC explicitly limits the Ceremony
// Events form to Event Name + Start/End Time; venue is read-only, pulled
// from the date's own Session(s) (the reminder line above), never
// re-entered per Item. STORY-068 is expected to default an Event Item's
// `venue` from its parent Session at submission time.
export interface WizardCeremonyItem {
  id: string;
  type: ItemType.Event;
  eventName: string;
  startTime: string;
  endTime: string;
}

// Field names match createItemBodySchema's own Meal-variant one-for-one.
export interface WizardFoodItem {
  id: string;
  type: ItemType.Meal;
  mealName: string;
  startTime: string;
  endTime: string;
  pax: number;
  limitedSeating: boolean;
  costPerPlate: number;
  menuItems: MenuItemChip[];
}

export type WizardDateEntry = WizardCeremonyItem | WizardFoodItem;

// byDate is exactly the forward contract event-details-step.tsx's own
// SessionsItemsStoreShape already documented and coded against (STORY-065)
// — a flat array per date, so its own "does this date already have
// Sessions & Items entries" check (a plain `.length > 0`) keeps working
// unchanged now that this shape is real. allDatesVisited is derived here
// (not in wizard-step-readiness.ts) since only this component can see
// Step 2's own distinct-dates list to compare visitedDates against.
interface SessionsItemsStepData {
  byDate: Record<string, WizardDateEntry[]>;
  visitedDates: string[];
  allDatesVisited: boolean;
}

const isSessionsItemsStepData = (value: unknown): value is SessionsItemsStepData =>
  typeof value === 'object' && value !== null && typeof (value as SessionsItemsStepData).byDate === 'object';

// The subset of Step 2's own stored shape this step actually reads — same
// "hand-rolled `is` guard for step-owned wizard data" idiom every other
// wizard step's own isXStepData already uses (there's no Zod schema for
// this forward-declared, submission-pending shape to narrow against
// instead, unlike a real API response).
interface EventDetailsSessionsShape {
  sessions: WizardSessionRow[];
}

const isEventDetailsSessionsShape = (value: unknown): value is EventDetailsSessionsShape =>
  typeof value === 'object' && value !== null && Array.isArray((value as EventDetailsSessionsShape).sessions);

interface CeremonyFormValues {
  eventNameOption: string;
  eventNameCustom: string;
  startTime: string;
  endTime: string;
}

const emptyCeremonyEntry: CeremonyFormValues = { eventNameOption: '', eventNameCustom: '', startTime: '', endTime: '' };

const toCeremonyFormValues = (item: WizardCeremonyItem): CeremonyFormValues => {
  const isPreset = CEREMONY_EVENT_NAME_PRESETS.includes(item.eventName);
  return {
    eventNameOption: isPreset ? item.eventName : item.eventName ? CUSTOM_CEREMONY_EVENT_OPTION : '',
    eventNameCustom: isPreset ? '' : item.eventName,
    startTime: item.startTime,
    endTime: item.endTime,
  };
};

// An Event Item with every field blank still persists as a valid row (this
// story's own edge case — both reference quotations print one) — this is
// the wizard-entry-time equivalent of that bare grey divider row.
const ceremonyRowLabel = (item: WizardCeremonyItem): string => {
  const parts = [item.eventName, formatSessionDuration(item.startTime, item.endTime)].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : '(blank ceremony row)';
};

interface FoodFormValues {
  mealNameOption: string;
  mealNameCustom: string;
  startTime: string;
  endTime: string;
  pax: number;
  limitedSeating: boolean;
  costPerPlate: number;
  menuItems: MenuItemChip[];
}

const emptyFoodEntry: FoodFormValues = {
  mealNameOption: '',
  mealNameCustom: '',
  startTime: '',
  endTime: '',
  pax: 0,
  limitedSeating: false,
  costPerPlate: 0,
  menuItems: [],
};

const toFoodFormValues = (item: WizardFoodItem): FoodFormValues => {
  const isPreset = MEAL_NAME_PRESETS.includes(item.mealName);
  return {
    mealNameOption: isPreset ? item.mealName : item.mealName ? CUSTOM_MEAL_NAME_OPTION : '',
    mealNameCustom: isPreset ? '' : item.mealName,
    startTime: item.startTime,
    endTime: item.endTime,
    pax: item.pax,
    limitedSeating: item.limitedSeating,
    costPerPlate: item.costPerPlate,
    menuItems: item.menuItems,
  };
};

// Time+random, not a module-level counter — same reasoning as
// client-details-step.tsx's own createRowId.
const createRowId = (): string => `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Wizard Step 4 (STORY-067). Date tabs derived from Step 2's own Sessions;
// per-date Ceremony/Food-Dining rows mirrored into the wizard store on
// every change, same pattern every prior step already established.
const SessionsItemsStep = () => {
  const { data, setStepData } = useEventWizard();
  const stored = data['sessions-items'];
  const restored = isSessionsItemsStepData(stored) ? stored : undefined;

  const eventDetailsData = data['event-details'];
  const sessions = isEventDetailsSessionsShape(eventDetailsData) ? eventDetailsData.sessions : [];
  const distinctDates = useMemo(() => getDistinctDates(sessions), [sessions]);

  const [byDate, setByDate] = useState<Record<string, WizardDateEntry[]>>(restored?.byDate ?? {});
  const [visitedDates, setVisitedDates] = useState<string[]>(restored?.visitedDates ?? []);
  const [activeDate, setActiveDate] = useState<string>(distinctDates[0] ?? '');

  // Marks the initial tab visited on mount — every later tab switch does
  // the same inline in handleSelectDate. Idempotent (the `.includes` guard
  // below), so no ref-guard is needed the way accommodation-step.tsx's own
  // mount-time seeding effect needed one.
  useEffect(() => {
    if (!activeDate) {
      return;
    }
    setVisitedDates((current) => (current.includes(activeDate) ? current : [...current, activeDate]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const allDatesVisited = distinctDates.length > 0 && distinctDates.every((date) => visitedDates.includes(date));
    setStepData('sessions-items', { byDate, visitedDates, allDatesVisited });
  }, [byDate, visitedDates, distinctDates, setStepData]);

  const [editingCeremonyId, setEditingCeremonyId] = useState<string | null>(null);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [foodSubmitError, setFoodSubmitError] = useState<string | null>(null);

  const ceremonyForm = useForm<CeremonyFormValues>({ defaultValues: emptyCeremonyEntry });
  const foodForm = useForm<FoodFormValues>({ defaultValues: emptyFoodEntry });
  const ceremonyNameOption = ceremonyForm.watch('eventNameOption');
  const mealNameOption = foodForm.watch('mealNameOption');
  const foodPax = foodForm.watch('pax');
  const foodLimitedSeating = foodForm.watch('limitedSeating');

  // The full Menu Item master list, fetched once here rather than
  // per-keystroke — same reasoning items-section.tsx's own identical query
  // documents.
  const menuItemsQuery = tsr.listMenuItems.useQuery({ queryKey: ['menu-items'], queryData: { query: {} } });
  const menuItemOptions: MenuItemChip[] = (menuItemsQuery.data?.body ?? []).map((menuItem) => ({
    id: menuItem.id,
    name: menuItem.name,
  }));
  const createMenuItemMutation = tsr.createMenuItem.useMutation();

  const handleSelectDate = (date: string) => {
    setActiveDate(date);
    setVisitedDates((current) => (current.includes(date) ? current : [...current, date]));
    ceremonyForm.reset(emptyCeremonyEntry);
    foodForm.reset(emptyFoodEntry);
    setEditingCeremonyId(null);
    setEditingFoodId(null);
    setFoodSubmitError(null);
  };

  const activeDateEntries = byDate[activeDate] ?? [];
  const ceremonyEntries = activeDateEntries.filter((entry): entry is WizardCeremonyItem => entry.type === ItemType.Event);
  const foodEntries = activeDateEntries.filter((entry): entry is WizardFoodItem => entry.type === ItemType.Meal);
  const activeDateSessions = sessions.filter((session) => activeDate >= session.startDate && activeDate <= session.endDate);

  const handleAddCeremonyEvent = ceremonyForm.handleSubmit((values) => {
    const eventName =
      values.eventNameOption === CUSTOM_CEREMONY_EVENT_OPTION ? values.eventNameCustom.trim() : values.eventNameOption;
    const newItem: WizardCeremonyItem = {
      id: editingCeremonyId ?? createRowId(),
      type: ItemType.Event,
      eventName,
      startTime: values.startTime,
      endTime: values.endTime,
    };
    setByDate((current) => {
      const existing = current[activeDate] ?? [];
      const next = editingCeremonyId
        ? existing.map((entry) => (entry.id === editingCeremonyId ? newItem : entry))
        : [...existing, newItem];
      return { ...current, [activeDate]: next };
    });
    ceremonyForm.reset(emptyCeremonyEntry);
    setEditingCeremonyId(null);
  });

  const handleEditCeremonyRow = (item: WizardCeremonyItem) => {
    setEditingCeremonyId(item.id);
    ceremonyForm.reset(toCeremonyFormValues(item));
  };

  const handleCancelCeremonyEdit = () => {
    setEditingCeremonyId(null);
    ceremonyForm.reset(emptyCeremonyEntry);
  };

  const handleRemoveCeremonyRow = (id: string) => {
    setByDate((current) => ({ ...current, [activeDate]: (current[activeDate] ?? []).filter((entry) => entry.id !== id) }));
    if (editingCeremonyId === id) {
      handleCancelCeremonyEdit();
    }
  };

  // Each chip with an empty id is a not-yet-real Menu Item the user typed
  // with no existing match — persisted for real here (unlike menu-item-
  // search.tsx's other caller, ItemCard, which defers resolution to
  // createItem/updateItem's own server-side find-or-create) since the
  // wizard has no Item-creation endpoint of its own to lean on yet, and
  // Menu Item is a shared, org-wide master list (SRS §4.6) worth adding for
  // real immediately, not only once STORY-068 eventually submits this
  // Event. A 409 (another concurrent add already created the exact name)
  // is recovered by re-searching rather than losing the row.
  const resolveMenuItemChips = async (chips: MenuItemChip[]): Promise<MenuItemChip[] | null> => {
    const resolved: MenuItemChip[] = [];
    for (const chip of chips) {
      if (chip.id) {
        resolved.push(chip);
        continue;
      }
      try {
        const response = await createMenuItemMutation.mutateAsync({ body: { name: chip.name } });
        resolved.push({ id: response.body.id, name: response.body.name });
      } catch {
        const refetched = await menuItemsQuery.refetch();
        const match = (refetched.data?.body ?? []).find(
          (option) => option.name.trim().toLowerCase() === chip.name.trim().toLowerCase(),
        );
        if (!match) {
          return null;
        }
        resolved.push({ id: match.id, name: match.name });
      }
    }
    return resolved;
  };

  const handleAddFoodEvent = foodForm.handleSubmit(async (values) => {
    setFoodSubmitError(null);
    const mealName = values.mealNameOption === CUSTOM_MEAL_NAME_OPTION ? values.mealNameCustom.trim() : values.mealNameOption;
    const hadNewChips = values.menuItems.some((chip) => chip.id === '');
    const resolvedMenuItems = await resolveMenuItemChips(values.menuItems);
    if (resolvedMenuItems === null) {
      setFoodSubmitError('Something went wrong adding a new menu item. Please try again.');
      return;
    }
    if (hadNewChips) {
      menuItemsQuery.refetch();
    }

    const newItem: WizardFoodItem = {
      id: editingFoodId ?? createRowId(),
      type: ItemType.Meal,
      mealName,
      startTime: values.startTime,
      endTime: values.endTime,
      // A cleared number input's valueAsNumber is NaN, not 0 — stored as-is
      // it would round-trip through sessionStorage's JSON.stringify as
      // null, corrupting formatQuotationPax's own "Npax" display. Same
      // "blank number field means 0" fallback accommodation-step.tsx's own
      // handleNumberFieldChange already applies.
      pax: Number.isFinite(values.pax) ? values.pax : 0,
      limitedSeating: values.limitedSeating,
      costPerPlate: Number.isFinite(values.costPerPlate) ? values.costPerPlate : 0,
      menuItems: resolvedMenuItems,
    };
    setByDate((current) => {
      const existing = current[activeDate] ?? [];
      const next = editingFoodId ? existing.map((entry) => (entry.id === editingFoodId ? newItem : entry)) : [...existing, newItem];
      return { ...current, [activeDate]: next };
    });
    foodForm.reset(emptyFoodEntry);
    setEditingFoodId(null);
  });

  const handleEditFoodRow = (item: WizardFoodItem) => {
    setEditingFoodId(item.id);
    foodForm.reset(toFoodFormValues(item));
  };

  const handleCancelFoodEdit = () => {
    setEditingFoodId(null);
    foodForm.reset(emptyFoodEntry);
  };

  const handleRemoveFoodRow = (id: string) => {
    setByDate((current) => ({ ...current, [activeDate]: (current[activeDate] ?? []).filter((entry) => entry.id !== id) }));
    if (editingFoodId === id) {
      handleCancelFoodEdit();
    }
  };

  if (distinctDates.length === 0) {
    return (
      <Typography variant="bodyM">Add at least one Session in Event Details before entering Sessions & Items.</Typography>
    );
  }

  const ceremonySubmitLabel = editingCeremonyId ? 'Save Ceremony Event' : 'Add Ceremony Event';
  const foodSubmitLabel = editingFoodId ? 'Save Food/Dining Event' : 'Add Food/Dining Event';
  const costFieldLabel = foodLimitedSeating ? 'Flat Cost' : 'Cost per Plate';
  const safeFoodPax = Number.isFinite(foodPax) ? foodPax : 0;

  let reminderContent: ReactNode;
  if (activeDateSessions.length === 0) {
    reminderContent = (
      <Typography variant="bodyM" sx={reminderStyles}>
        No Session from Event Details covers this date.
      </Typography>
    );
  } else {
    reminderContent = activeDateSessions.map((session) => (
      <Typography key={session.id} variant="bodyM" sx={reminderStyles}>
        {session.sessionType} — Venue for this date: {session.venue} · {formatAmount(session.venueCost)}/- (from Event
        Details)
      </Typography>
    ));
  }

  return (
    <Stack sx={wrapperStyles}>
      <Tabs value={activeDate} onChange={(_event, value: string) => handleSelectDate(value)}>
        {distinctDates.map((date) => (
          <Tab key={date} value={date} label={formatEventDate(date)} />
        ))}
      </Tabs>

      <Stack>{reminderContent}</Stack>

      <Paper elevation={0} component="form" onSubmit={handleAddCeremonyEvent} sx={sectionCardStyles}>
        <Typography variant="titleM" component="h2">
          Ceremony Events
        </Typography>
        <Stack direction="row" sx={rowStyles}>
          <Controller
            name="eventNameOption"
            control={ceremonyForm.control}
            render={({ field }) => (
              <TextField {...field} select label="Event Name" sx={optionFieldStyles}>
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
          {ceremonyNameOption === CUSTOM_CEREMONY_EVENT_OPTION && (
            <TextField {...ceremonyForm.register('eventNameCustom')} label="Custom event name" sx={optionFieldStyles} />
          )}
        </Stack>
        <Stack direction="row" sx={rowStyles}>
          <Stack sx={timeFieldStyles}>
            <Typography variant="labelS" sx={miniFieldLabelStyles}>
              Start time
            </Typography>
            <Controller
              name="startTime"
              control={ceremonyForm.control}
              render={({ field }) => (
                <StaticTimePicker ampm value={toPickerTime(field.value)} onChange={(time) => field.onChange(fromPickerTime(time))} />
              )}
            />
          </Stack>
          <Stack sx={timeFieldStyles}>
            <Typography variant="labelS" sx={miniFieldLabelStyles}>
              End time
            </Typography>
            <Controller
              name="endTime"
              control={ceremonyForm.control}
              render={({ field }) => (
                <StaticTimePicker ampm value={toPickerTime(field.value)} onChange={(time) => field.onChange(fromPickerTime(time))} />
              )}
            />
          </Stack>
        </Stack>
        <Stack direction="row" sx={rowStyles}>
          <Button type="submit" variant="contained" startIcon={<AddIcon />} sx={addButtonStyles}>
            {ceremonySubmitLabel}
          </Button>
          {editingCeremonyId && <Button onClick={handleCancelCeremonyEdit}>Cancel edit</Button>}
        </Stack>
      </Paper>

      <Stack sx={rowListStyles}>
        {ceremonyEntries.map((item) => {
          const isEditing = editingCeremonyId === item.id;
          const cardSx = isEditing ? rowCardEditingStyles : rowCardStyles;
          return (
            <Stack key={item.id} direction="row" sx={cardSx} onClick={() => handleEditCeremonyRow(item)}>
              <Typography variant="bodyM">{ceremonyRowLabel(item)}</Typography>
              <IconButton
                aria-label={`Remove ${item.eventName || 'ceremony event'} row`}
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  handleRemoveCeremonyRow(item.id);
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          );
        })}
      </Stack>

      <Paper elevation={0} component="form" onSubmit={handleAddFoodEvent} sx={sectionCardStyles}>
        <Typography variant="titleM" component="h2">
          Food/Dining Events
        </Typography>
        <Stack direction="row" sx={rowStyles}>
          <Controller
            name="mealNameOption"
            control={foodForm.control}
            render={({ field }) => (
              <TextField {...field} select label="Meal Name" sx={optionFieldStyles}>
                <MenuItem value="">Select a meal name</MenuItem>
                {MEAL_NAME_PRESETS.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
                <MenuItem value={CUSTOM_MEAL_NAME_OPTION}>{CUSTOM_MEAL_NAME_OPTION}</MenuItem>
              </TextField>
            )}
          />
          {mealNameOption === CUSTOM_MEAL_NAME_OPTION && (
            <TextField {...foodForm.register('mealNameCustom')} label="Custom meal name" sx={optionFieldStyles} />
          )}
        </Stack>
        <Stack direction="row" sx={rowStyles}>
          <Stack sx={timeFieldStyles}>
            <Typography variant="labelS" sx={miniFieldLabelStyles}>
              Start time
            </Typography>
            <Controller
              name="startTime"
              control={foodForm.control}
              render={({ field }) => (
                <StaticTimePicker ampm value={toPickerTime(field.value)} onChange={(time) => field.onChange(fromPickerTime(time))} />
              )}
            />
          </Stack>
          <Stack sx={timeFieldStyles}>
            <Typography variant="labelS" sx={miniFieldLabelStyles}>
              End time
            </Typography>
            <Controller
              name="endTime"
              control={foodForm.control}
              render={({ field }) => (
                <StaticTimePicker ampm value={toPickerTime(field.value)} onChange={(time) => field.onChange(fromPickerTime(time))} />
              )}
            />
          </Stack>
        </Stack>
        <Stack direction="row" sx={paxRowStyles}>
          <TextField
            {...foodForm.register('pax', { valueAsNumber: true })}
            label="Pax"
            type="number"
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <Stack direction="row" sx={lsToggleRowStyles}>
            <Typography variant="labelS" sx={lsLabelStyles(foodLimitedSeating)}>
              L.S.
            </Typography>
            <Controller
              name="limitedSeating"
              control={foodForm.control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  sx={lsSwitchStyles}
                  slotProps={{ input: { 'aria-label': 'Limited Seating' } }}
                />
              )}
            />
          </Stack>
          <TextField
            {...foodForm.register('costPerPlate', { valueAsNumber: true })}
            label={costFieldLabel}
            type="number"
            slotProps={{ htmlInput: { min: 0 } }}
          />
        </Stack>
        <Controller
          name="menuItems"
          control={foodForm.control}
          render={({ field }) => <MenuItemSearch options={menuItemOptions} value={field.value} onChange={field.onChange} />}
        />
        <Typography variant="bodyM" sx={previewLineStyles}>
          Shown on Quotation as: {formatQuotationPax(safeFoodPax, foodLimitedSeating)}
        </Typography>
        {foodSubmitError && (
          <Alert severity="error">
            <Typography variant="bodyM">{foodSubmitError}</Typography>
          </Alert>
        )}
        <Stack direction="row" sx={rowStyles}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            sx={addButtonStyles}
            disabled={createMenuItemMutation.isPending}
          >
            {foodSubmitLabel}
          </Button>
          {editingFoodId && (
            // Disabled while the async submit (menu item resolution) is in
            // flight — otherwise clicking Cancel here doesn't actually stop
            // that in-flight save, which still applies to this row once it
            // resolves, silently overwriting whatever the user believed
            // they'd backed out of.
            <Button onClick={handleCancelFoodEdit} disabled={createMenuItemMutation.isPending}>
              Cancel edit
            </Button>
          )}
        </Stack>
      </Paper>

      <Stack sx={rowListStyles}>
        {foodEntries.map((item) => {
          const isEditing = editingFoodId === item.id;
          const cardSx = isEditing ? rowCardEditingStyles : rowCardStyles;
          const mealNameLabel = item.mealName || '(blank food row)';
          const menuItemsSuffix = item.menuItems.length > 0 ? ` · ${item.menuItems.map((menuItem) => menuItem.name).join(', ')}` : '';
          return (
            <Stack key={item.id} direction="row" sx={cardSx} onClick={() => handleEditFoodRow(item)}>
              <Typography variant="bodyM">
                {mealNameLabel} · {formatQuotationPax(item.pax, item.limitedSeating)} · {formatAmount(item.costPerPlate)}
                {menuItemsSuffix}
              </Typography>
              <IconButton
                aria-label={`Remove ${item.mealName || 'food event'} row`}
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  handleRemoveFoodRow(item.id);
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default SessionsItemsStep;
