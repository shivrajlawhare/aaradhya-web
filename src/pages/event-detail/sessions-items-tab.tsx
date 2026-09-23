import { type ReactNode, useMemo, useState } from 'react';
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
import type { z } from 'zod';
import { tsr } from '../../api/client';
import { useToast } from '../../components/ui/toast-provider';
import { type filteredEventResultSchema, ItemType } from '../../contract';
import { formatEventDate, formatQuotationPax, formatSessionDuration } from '../../utils/quotation-formatting';
import { getDistinctDates } from '../../utils/session-dates';
import { fromPickerTime, toDateInputValue, toPickerTime } from './date-input';
import { formatAmount } from './format-amount';
import MenuItemSearch, { type MenuItemChip } from './menu-item-search';
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
  rowCardReadOnlyStyles,
  rowCardStyles,
  rowListStyles,
  rowStyles,
  sectionCardStyles,
  timeFieldStyles,
  wrapperStyles,
} from './sessions-items-tab.styles';

type PublicEvent = z.infer<typeof filteredEventResultSchema>;
type SessionResult = PublicEvent['sessions'][number];
type ItemResult = NonNullable<SessionResult['items']>[number];

// Same presets as sessions-items-step.tsx's own identical fields — no
// master list backs either list (SRS names none), same "illustrative
// placeholder" reasoning that step's own comment already documents.
const CEREMONY_EVENT_NAME_PRESETS = ['Muhurta', 'Engagement Sangeet', 'Cake Cutting'];
const CUSTOM_CEREMONY_EVENT_OPTION = 'Custom…';
const MEAL_NAME_PRESETS = ['Breakfast', 'Lunch', 'Hi-Tea', 'Dinner'];
const CUSTOM_MEAL_NAME_OPTION = 'Custom…';

interface CeremonyFormValues {
  eventNameOption: string;
  eventNameCustom: string;
  startTime: string;
  endTime: string;
}

const emptyCeremonyEntry: CeremonyFormValues = { eventNameOption: '', eventNameCustom: '', startTime: '', endTime: '' };

const toCeremonyFormValues = (item: ItemResult): CeremonyFormValues => {
  const eventName = item.eventName ?? '';
  const isPreset = CEREMONY_EVENT_NAME_PRESETS.includes(eventName);
  return {
    eventNameOption: isPreset ? eventName : eventName ? CUSTOM_CEREMONY_EVENT_OPTION : '',
    eventNameCustom: isPreset ? '' : eventName,
    startTime: item.startTime ?? '',
    endTime: item.endTime ?? '',
  };
};

// An Event Item with every field blank still persists as a valid row (both
// reference quotations print one, STORY-071) — same "(blank ... row)"
// fallback sessions-items-step.tsx's own identical label already uses.
const ceremonyRowLabel = (item: ItemResult): string => {
  const parts = [item.eventName, formatSessionDuration(item.startTime ?? '', item.endTime ?? '')].filter(Boolean);
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

const toFoodFormValues = (item: ItemResult, menuItemsById: Map<string, string>): FoodFormValues => {
  const mealName = item.mealName ?? '';
  const isPreset = MEAL_NAME_PRESETS.includes(mealName);
  return {
    mealNameOption: isPreset ? mealName : mealName ? CUSTOM_MEAL_NAME_OPTION : '',
    mealNameCustom: isPreset ? '' : mealName,
    startTime: item.startTime ?? '',
    endTime: item.endTime ?? '',
    pax: item.pax ?? 0,
    limitedSeating: item.limitedSeating ?? false,
    costPerPlate: item.costPerPlate ?? 0,
    menuItems: (item.menuItems ?? []).map((id) => ({ id, name: menuItemsById.get(id) ?? id })),
  };
};

// A real, persisted Item tagged with the Session it actually lives under —
// needed to target PATCH/DELETE .../sessions/:sid/items/:iid correctly,
// unlike the wizard's own wizard-local ids which never had this ambiguity.
interface DateEntry {
  sessionId: string;
  item: ItemResult;
}

interface EditingItem {
  sessionId: string;
  itemId: string;
}

interface SessionsItemsTabProps {
  event: PublicEvent;
  // Full edit (Event Manager) vs read-only Food/Dining only (F&B Head, the
  // only other role this tab is ever mounted for — event-detail-page.tsx's
  // own gate excludes Housekeeping/Reception, since the backend's own
  // filterEventForRole sends Housekeeping/Reception no `items` at all, and
  // Reception can't see Sessions in any form). Ceremony Events are never
  // rendered for a non-EventManager caller: F&B Head's own filtered
  // response never includes them to begin with (Meal Items only), so an
  // always-empty Ceremony section would serve no purpose.
  canEdit: boolean;
  onEventChanged: () => void;
}

// STORY-079 — the real, persisted-data counterpart to the wizard's own
// sessions-items-step.tsx: same day-tabbed Ceremony/Food-Dining UX (a
// persistent entry form above already-added row cards, click a row to load
// it back into the form for editing), but every Add/Save/Delete is an
// immediate, independent API call against the real Event (createItem/
// updateItem/deleteItem, STORY-032/033) — there's no wizard store, no
// "Next" gate, and no draft state that could be lost on navigation.
//
// A real Item has no date field of its own — a Session's own `items` array
// is flat, with no per-calendar-day tag surviving past the wizard's own
// pre-submission `byDate` grouping (review-step.tsx's own mapSessionsForSubmit
// already collapses it once, permanently, at Event-creation time). So unlike
// the wizard, this screen can't offer true per-day granularity within a
// multi-day Session: a Session's entire items list is shown under the one
// date tab matching its own startDate — the same convention quotation-
// document.tsx's own dateGroups already established for exactly this same
// data (STORY-071/072), reused here rather than re-litigated. A date only
// spanned (not started) by an ongoing multi-day Session shows no items of
// its own and no entry form (there's no Session to attach a new Item to on
// that date), just an informational note.
const SessionsItemsTab = ({ event, canEdit, onEventChanged }: SessionsItemsTabProps) => {
  const { showSuccess, showError } = useToast();
  const distinctDates = useMemo(() => getDistinctDates(event.sessions), [event.sessions]);
  const [activeDateState, setActiveDateState] = useState<string>(distinctDates[0] ?? '');
  // Falls back to the first date rather than calling setState mid-render if
  // a Session added/removed elsewhere (Event Details tab) ever makes the
  // previously-active date stop existing — this tab's own onEventChanged
  // refetch could otherwise leave `activeDateState` pointing at a date with
  // no matching Tab any more.
  const activeDate = distinctDates.includes(activeDateState) ? activeDateState : (distinctDates[0] ?? '');

  const [editingCeremony, setEditingCeremony] = useState<EditingItem | null>(null);
  const [editingFood, setEditingFood] = useState<EditingItem | null>(null);
  const [ceremonySubmitError, setCeremonySubmitError] = useState<string | null>(null);
  const [foodSubmitError, setFoodSubmitError] = useState<string | null>(null);

  const ceremonyForm = useForm<CeremonyFormValues>({ defaultValues: emptyCeremonyEntry });
  const foodForm = useForm<FoodFormValues>({ defaultValues: emptyFoodEntry });
  const ceremonyNameOption = ceremonyForm.watch('eventNameOption');
  const mealNameOption = foodForm.watch('mealNameOption');
  const foodPax = foodForm.watch('pax');
  const foodLimitedSeating = foodForm.watch('limitedSeating');

  // The full Menu Item master list, fetched once — same reasoning items-
  // section.tsx's own identical query already documents. Any authenticated
  // role can call GET /menu-items, so this resolves names for F&B Head's
  // own read-only view too, not just Event Manager's edit forms.
  const menuItemsQuery = tsr.listMenuItems.useQuery({ queryKey: ['menu-items'], queryData: { query: {} } });
  const menuItemOptions: MenuItemChip[] = (menuItemsQuery.data?.body ?? []).map((menuItem) => ({
    id: menuItem.id,
    name: menuItem.name,
  }));
  const menuItemsById = new Map(menuItemOptions.map((option) => [option.id, option.name]));

  const createItemMutation = tsr.createItem.useMutation();
  const updateItemMutation = tsr.updateItem.useMutation();
  const deleteItemMutation = tsr.deleteItem.useMutation();
  const isMutating = createItemMutation.isPending || updateItemMutation.isPending || deleteItemMutation.isPending;

  const handleSelectDate = (date: string) => {
    setActiveDateState(date);
    ceremonyForm.reset(emptyCeremonyEntry);
    foodForm.reset(emptyFoodEntry);
    setEditingCeremony(null);
    setEditingFood(null);
    setCeremonySubmitError(null);
    setFoodSubmitError(null);
  };

  // Sessions whose own startDate is this exact date — the "owner(s)" of
  // this tab, both for which already-saved Items show here (their entire
  // flat items list) and which Session a newly-added Item attaches to. Two
  // Sessions sharing a start date (STORY-071's own Halad+Engagement
  // example) both contribute their Items here; a brand-new Item targets
  // the first one, matching review-step.tsx's own mapSessionsForSubmit
  // "first Session in entry order" convention.
  const sessionsStartingOnDate = event.sessions.filter((session) => toDateInputValue(session.startDate) === activeDate);
  const targetSession = editingCeremony
    ? event.sessions.find((session) => session.id === editingCeremony.sessionId)
    : sessionsStartingOnDate[0];
  const foodTargetSession = editingFood
    ? event.sessions.find((session) => session.id === editingFood.sessionId)
    : sessionsStartingOnDate[0];

  const dateEntries: DateEntry[] = sessionsStartingOnDate.flatMap((session) =>
    (session.items ?? []).map((item) => ({ sessionId: session.id, item }))
  );
  const ceremonyEntries = dateEntries.filter((entry) => entry.item.type === ItemType.Event);
  const foodEntries = dateEntries.filter((entry) => entry.item.type === ItemType.Meal);

  const handleAddCeremonyEvent = ceremonyForm.handleSubmit((values) => {
    if (isMutating) {
      return;
    }
    const sessionId = editingCeremony?.sessionId ?? targetSession?.id;
    if (!sessionId) {
      return;
    }
    setCeremonySubmitError(null);
    const eventName =
      values.eventNameOption === CUSTOM_CEREMONY_EVENT_OPTION ? values.eventNameCustom.trim() : values.eventNameOption;
    // No user-facing Venue field — same convention sessions-items-step.tsx's
    // own Ceremony form already establishes ("venue is read-only, pulled
    // from the date's own Session"), applied here against the real owning
    // Session instead of a wizard-local reminder line.
    const body = {
      type: ItemType.Event as const,
      eventName,
      venue: targetSession?.venue ?? '',
      startTime: values.startTime.trim() || undefined,
      endTime: values.endTime.trim() || undefined,
    };
    const callbacks = {
      onSuccess: () => {
        ceremonyForm.reset(emptyCeremonyEntry);
        showSuccess(editingCeremony ? 'Ceremony event saved.' : 'Ceremony event added.');
        setEditingCeremony(null);
        onEventChanged();
      },
      onError: () => {
        setCeremonySubmitError('Something went wrong. Please try again.');
        showError('Something went wrong. Please try again.');
      },
    };
    if (editingCeremony) {
      updateItemMutation.mutate(
        { params: { id: event.id, sid: editingCeremony.sessionId, iid: editingCeremony.itemId }, body },
        callbacks
      );
    } else {
      createItemMutation.mutate({ params: { id: event.id, sid: sessionId }, body }, callbacks);
    }
  });

  const handleEditCeremonyRow = (entry: DateEntry) => {
    setEditingCeremony({ sessionId: entry.sessionId, itemId: entry.item.id });
    ceremonyForm.reset(toCeremonyFormValues(entry.item));
  };

  const handleCancelCeremonyEdit = () => {
    setEditingCeremony(null);
    ceremonyForm.reset(emptyCeremonyEntry);
  };

  const handleRemoveCeremonyRow = (entry: DateEntry) => {
    if (isMutating) {
      return;
    }
    setCeremonySubmitError(null);
    deleteItemMutation.mutate(
      { params: { id: event.id, sid: entry.sessionId, iid: entry.item.id } },
      {
        onSuccess: () => {
          if (editingCeremony?.itemId === entry.item.id) {
            handleCancelCeremonyEdit();
          }
          showSuccess('Ceremony event removed.');
          onEventChanged();
        },
        onError: () => {
          setCeremonySubmitError('Something went wrong. Please try again.');
          showError('Something went wrong. Please try again.');
        },
      }
    );
  };

  const handleAddFoodEvent = foodForm.handleSubmit((values) => {
    if (isMutating) {
      return;
    }
    const sessionId = editingFood?.sessionId ?? foodTargetSession?.id;
    if (!sessionId) {
      return;
    }
    setFoodSubmitError(null);
    const mealName =
      values.mealNameOption === CUSTOM_MEAL_NAME_OPTION ? values.mealNameCustom.trim() : values.mealNameOption;
    // Each chip becomes an { id } reference or a { name } reference — the
    // server resolves either (find-or-create), same convention item-card.
    // tsx's own identical handleSaveItem already establishes. Simpler than
    // the wizard's own resolveMenuItemChips: this screen has a real Item
    // endpoint to lean on, so there's no need to pre-resolve a name to an id
    // client-side before submitting.
    const menuItemsPayload = values.menuItems.map((chip) => (chip.id ? { id: chip.id } : { name: chip.name }));
    // A chip with an empty id is a not-yet-real Menu Item the server is
    // about to find-or-create — `menuItemsById` below was built from a
    // fetch taken before that id existed, so without refetching, this same
    // Item's own row card would render the brand-new id raw (exactly the
    // "menu items showing as their object id" bug this story exists to
    // fix) the instant it reappears via onEventChanged's refetch.
    const hasUnresolvedChip = values.menuItems.some((chip) => chip.id === '');
    const body = {
      type: ItemType.Meal as const,
      mealName,
      pax: Number.isFinite(values.pax) ? values.pax : 0,
      costPerPlate: Number.isFinite(values.costPerPlate) ? values.costPerPlate : 0,
      limitedSeating: values.limitedSeating,
      menuItems: menuItemsPayload,
      startTime: values.startTime.trim() || undefined,
      endTime: values.endTime.trim() || undefined,
    };
    const callbacks = {
      onSuccess: () => {
        foodForm.reset(emptyFoodEntry);
        showSuccess(editingFood ? 'Food/dining event saved.' : 'Food/dining event added.');
        setEditingFood(null);
        if (hasUnresolvedChip) {
          menuItemsQuery.refetch();
        }
        onEventChanged();
      },
      onError: () => {
        setFoodSubmitError('Something went wrong. Please try again.');
        showError('Something went wrong. Please try again.');
      },
    };
    if (editingFood) {
      updateItemMutation.mutate(
        { params: { id: event.id, sid: editingFood.sessionId, iid: editingFood.itemId }, body },
        callbacks
      );
    } else {
      createItemMutation.mutate({ params: { id: event.id, sid: sessionId }, body }, callbacks);
    }
  });

  const handleEditFoodRow = (entry: DateEntry) => {
    setEditingFood({ sessionId: entry.sessionId, itemId: entry.item.id });
    foodForm.reset(toFoodFormValues(entry.item, menuItemsById));
  };

  const handleCancelFoodEdit = () => {
    setEditingFood(null);
    foodForm.reset(emptyFoodEntry);
  };

  const handleRemoveFoodRow = (entry: DateEntry) => {
    if (isMutating) {
      return;
    }
    setFoodSubmitError(null);
    deleteItemMutation.mutate(
      { params: { id: event.id, sid: entry.sessionId, iid: entry.item.id } },
      {
        onSuccess: () => {
          if (editingFood?.itemId === entry.item.id) {
            handleCancelFoodEdit();
          }
          showSuccess('Food/dining event removed.');
          onEventChanged();
        },
        onError: () => {
          setFoodSubmitError('Something went wrong. Please try again.');
          showError('Something went wrong. Please try again.');
        },
      }
    );
  };

  if (distinctDates.length === 0) {
    return (
      <Typography variant="bodyM">
        Add at least one Session on the Event Details tab before entering Sessions & Items.
      </Typography>
    );
  }

  const ceremonySubmitLabel = editingCeremony ? 'Save Ceremony Event' : 'Add Ceremony Event';
  const foodSubmitLabel = editingFood ? 'Save Food/Dining Event' : 'Add Food/Dining Event';
  const costFieldLabel = foodLimitedSeating ? 'Flat Cost' : 'Cost per Plate';
  const safeFoodPax = Number.isFinite(foodPax) ? foodPax : 0;

  let reminderContent: ReactNode;
  if (sessionsStartingOnDate.length === 0) {
    reminderContent = (
      <Typography variant="bodyM" sx={reminderStyles}>
        No Session starts on this date — it falls within a multi-day Session whose Items are shown under that Session's
        own start date instead.
      </Typography>
    );
  } else {
    reminderContent = sessionsStartingOnDate.map((session) => (
      <Typography key={session.id} variant="bodyM" sx={reminderStyles}>
        {session.sessionType} — Venue for this date: {session.venue}
        {/* venueCost is stripped for every role but Event Manager
            (STORY-046) — omitted rather than printing "NaN" when absent. */}
        {session.venueCost !== undefined ? ` · ${formatAmount(session.venueCost)}/-` : ''} (from Event Details)
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

      {canEdit && sessionsStartingOnDate.length > 0 && (
        <>
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
                <TextField
                  {...ceremonyForm.register('eventNameCustom')}
                  label="Custom event name"
                  sx={optionFieldStyles}
                />
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
                    <StaticTimePicker
                      ampm
                      value={toPickerTime(field.value)}
                      onChange={(time) => field.onChange(fromPickerTime(time))}
                    />
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
                    <StaticTimePicker
                      ampm
                      value={toPickerTime(field.value)}
                      onChange={(time) => field.onChange(fromPickerTime(time))}
                    />
                  )}
                />
              </Stack>
            </Stack>
            {ceremonySubmitError && (
              <Alert severity="error">
                <Typography variant="bodyM">{ceremonySubmitError}</Typography>
              </Alert>
            )}
            <Stack direction="row" sx={rowStyles}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                sx={addButtonStyles}
                disabled={!ceremonyForm.formState.isDirty || isMutating}
              >
                {ceremonySubmitLabel}
              </Button>
              {editingCeremony && (
                <Button onClick={handleCancelCeremonyEdit} disabled={isMutating}>
                  Cancel edit
                </Button>
              )}
            </Stack>
          </Paper>

          <Stack sx={rowListStyles}>
            {ceremonyEntries.map((entry) => {
              const isEditing = editingCeremony?.itemId === entry.item.id;
              return (
                <Stack
                  key={entry.item.id}
                  direction="row"
                  sx={isEditing ? rowCardEditingStyles : rowCardStyles}
                  onClick={() => handleEditCeremonyRow(entry)}
                >
                  <Typography variant="bodyM">{ceremonyRowLabel(entry.item)}</Typography>
                  <IconButton
                    aria-label={`Remove ${entry.item.eventName || 'ceremony event'} row`}
                    size="small"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      handleRemoveCeremonyRow(entry);
                    }}
                    disabled={isMutating}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>
        </>
      )}

      {canEdit && sessionsStartingOnDate.length > 0 && (
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
                  <StaticTimePicker
                    ampm
                    value={toPickerTime(field.value)}
                    onChange={(time) => field.onChange(fromPickerTime(time))}
                  />
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
                  <StaticTimePicker
                    ampm
                    value={toPickerTime(field.value)}
                    onChange={(time) => field.onChange(fromPickerTime(time))}
                  />
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
                    onChange={(changeEvent) => field.onChange(changeEvent.target.checked)}
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
            render={({ field }) => (
              <MenuItemSearch options={menuItemOptions} value={field.value} onChange={field.onChange} />
            )}
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
              disabled={!foodForm.formState.isDirty || isMutating}
            >
              {foodSubmitLabel}
            </Button>
            {editingFood && (
              <Button onClick={handleCancelFoodEdit} disabled={isMutating}>
                Cancel edit
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      <Stack sx={rowListStyles}>
        {foodEntries.map((entry) => {
          const item = entry.item;
          const isEditing = editingFood?.itemId === item.id;
          const mealNameLabel = item.mealName || '(blank food row)';
          const menuItemNames = (item.menuItems ?? []).map((id) => menuItemsById.get(id) ?? id);
          const menuItemsSuffix = menuItemNames.length > 0 ? ` · ${menuItemNames.join(', ')}` : '';
          // costPerPlate/totalCost are stripped for every role but Event
          // Manager (STORY-046) — an F&B Head's own read-only row omits
          // cost entirely rather than printing "—"/"NaN" for a field it was
          // never sent.
          const costSuffix = canEdit ? ` · ${formatAmount(item.costPerPlate ?? 0)}` : '';
          if (!canEdit) {
            return (
              <Stack key={item.id} direction="row" sx={rowCardReadOnlyStyles}>
                <Typography variant="bodyM">
                  {mealNameLabel} · {formatQuotationPax(item.pax ?? 0, item.limitedSeating ?? false)}
                  {costSuffix}
                  {menuItemsSuffix}
                </Typography>
              </Stack>
            );
          }
          return (
            <Stack
              key={item.id}
              direction="row"
              sx={isEditing ? rowCardEditingStyles : rowCardStyles}
              onClick={() => handleEditFoodRow(entry)}
            >
              <Typography variant="bodyM">
                {mealNameLabel} · {formatQuotationPax(item.pax ?? 0, item.limitedSeating ?? false)}
                {costSuffix}
                {menuItemsSuffix}
                {item.totalCost !== undefined && item.totalCost !== null
                  ? ` · Total cost: ${formatAmount(item.totalCost)}`
                  : ''}
              </Typography>
              <IconButton
                aria-label={`Remove ${item.mealName || 'food event'} row`}
                size="small"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  handleRemoveFoodRow(entry);
                }}
                disabled={isMutating}
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

export default SessionsItemsTab;
