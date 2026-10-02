import { type ReactNode, useMemo, useState } from 'react';
import { Alert, Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import ItemCard from '../../components/ui/item-card';
import { ItemCardFoodDetails, ItemCardTime } from '../../components/ui/item-card-details';
import { useToast } from '../../components/ui/toast-provider';
import { type createItemBodySchema, type filteredEventResultSchema, ItemType } from '../../contract';
import { formatEventDate, formatQuotationPax, formatSessionDuration } from '../../utils/quotation-formatting';
import { getDistinctDates } from '../../utils/session-dates';
import CeremonyFormCard from '../event-creation/ceremony-form-card';
import FoodFormCard from '../event-creation/food-form-card';
import {
  CEREMONY_EVENT_NAME_PRESETS,
  type CeremonyFormValues,
  CUSTOM_CEREMONY_EVENT_OPTION,
  CUSTOM_MEAL_NAME_OPTION,
  emptyCeremonyEntry,
  emptyFoodEntry,
  type FoodFormValues,
  MEAL_NAME_PRESETS,
} from '../event-creation/sessions-items-forms';
import { toDateInputValue } from './date-input';
import { formatAmount } from './format-amount';
import type { MenuItemChip } from './menu-item-search';
import { dateTabsStyles, itemGridStyles, reminderListStyles } from './sessions-items-tab.styles';
import { tabSectionStyles } from './tab-card.styles';

type PublicEvent = z.infer<typeof filteredEventResultSchema>;
type SessionResult = PublicEvent['sessions'][number];
type ItemResult = NonNullable<SessionResult['items']>[number];

// An Event Item with every field blank still persists as a valid row (both
// reference quotations print one, STORY-071).
const BLANK_CEREMONY_TITLE = '(blank ceremony row)';
const BLANK_FOOD_TITLE = '(blank food row)';

// The wizard's converters take wizard items; these take saved Items.
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

// venueCost is stripped for every role but Event Manager (STORY-046) — the
// reminder omits it rather than printing "NaN" (UI-24: F&B sees no cost).
const formatVenueCostSuffix = (venueCost: number | undefined): string => {
  if (venueCost === undefined) {
    return '';
  }
  return ` · ${formatAmount(venueCost)}/-`;
};

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

  // The full Menu Item master list, fetched once (not per keystroke). Any
  // authenticated role can call GET /menu-items, so this resolves names for F&B Head's
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
    const body: z.infer<typeof createItemBodySchema> = {
      type: ItemType.Event,
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
    // server resolves either (find-or-create). Simpler than
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

  let reminderContent: ReactNode;
  if (sessionsStartingOnDate.length === 0) {
    reminderContent = (
      <Alert severity="info">
        No Session starts on this date — it falls within a multi-day Session whose Items are shown under that Session's
        own start date instead.
      </Alert>
    );
  } else {
    reminderContent = sessionsStartingOnDate.map((session) => (
      <Alert key={session.id} severity="info">
        {session.sessionType} — Venue for this date: {session.venue}
        {formatVenueCostSuffix(session.venueCost)} (from Event Details)
      </Alert>
    ));
  }

  const canEditDate = canEdit && sessionsStartingOnDate.length > 0;

  return (
    <Stack sx={tabSectionStyles}>
      <Tabs
        value={activeDate}
        onChange={(_event, value: string) => handleSelectDate(value)}
        variant="scrollable"
        scrollButtons={false}
        sx={dateTabsStyles}
      >
        {distinctDates.map((date) => (
          <Tab key={date} value={date} label={formatEventDate(date)} />
        ))}
      </Tabs>

      <Stack sx={reminderListStyles}>{reminderContent}</Stack>

      {/* D6: this tab keeps the two always-open cards (the wizard's
          two-button pattern is step 4 only); the cards are shared with it. */}
      {canEditDate && (
        <CeremonyFormCard
          form={ceremonyForm}
          isEditing={editingCeremony !== null}
          isSubmitDisabled={!ceremonyForm.formState.isDirty}
          isSubmitting={isMutating}
          submitError={ceremonySubmitError}
          onSubmit={handleAddCeremonyEvent}
          onCancelEdit={handleCancelCeremonyEdit}
        />
      )}

      {canEditDate && ceremonyEntries.length > 0 && (
        <Box component="ul" aria-label="Ceremony events" sx={itemGridStyles}>
          {ceremonyEntries.map((entry) => (
            <li key={entry.item.id}>
              <ItemCard
                title={entry.item.eventName || BLANK_CEREMONY_TITLE}
                editable={{
                  removeLabel: `Remove ${entry.item.eventName || 'ceremony event'} row`,
                  isEditing: editingCeremony?.itemId === entry.item.id,
                  isRemoveDisabled: isMutating,
                  onEdit: () => handleEditCeremonyRow(entry),
                  onRemove: () => handleRemoveCeremonyRow(entry),
                }}
              >
                <ItemCardTime duration={formatSessionDuration(entry.item.startTime ?? '', entry.item.endTime ?? '')} />
              </ItemCard>
            </li>
          ))}
        </Box>
      )}

      {canEditDate && (
        <FoodFormCard
          form={foodForm}
          menuItemOptions={menuItemOptions}
          isEditing={editingFood !== null}
          isSubmitDisabled={!foodForm.formState.isDirty}
          isSubmitting={isMutating}
          submitError={foodSubmitError}
          onSubmit={handleAddFoodEvent}
          onCancelEdit={handleCancelFoodEdit}
        />
      )}

      {foodEntries.length > 0 && (
        <Box component="ul" aria-label="Food/dining events" sx={itemGridStyles}>
          {foodEntries.map((entry) => {
            const { item } = entry;
            const menuItemNames = (item.menuItems ?? []).map((id) => menuItemsById.get(id) ?? id);
            // costPerPlate/totalCost are stripped for every role but Event
            // Manager (STORY-046) — F&B Head's read-only card shows no cost.
            let cost: string | undefined;
            if (canEdit) {
              const totalCost = item.totalCost ?? null;
              const totalSuffix = totalCost !== null ? ` · Total cost: ${formatAmount(totalCost)}` : '';
              cost = `₹ ${formatAmount(item.costPerPlate ?? 0)}${totalSuffix}`;
            }
            const editable = canEdit
              ? {
                  removeLabel: `Remove ${item.mealName || 'food event'} row`,
                  isEditing: editingFood?.itemId === item.id,
                  isRemoveDisabled: isMutating,
                  onEdit: () => handleEditFoodRow(entry),
                  onRemove: () => handleRemoveFoodRow(entry),
                }
              : undefined;
            return (
              <li key={item.id}>
                <ItemCard title={item.mealName || BLANK_FOOD_TITLE} editable={editable}>
                  <ItemCardFoodDetails
                    pax={formatQuotationPax(item.pax ?? 0, item.limitedSeating ?? false)}
                    cost={cost}
                    menuItemNames={menuItemNames}
                    menuLabel={`${item.mealName || 'Food'} menu items`}
                  />
                </ItemCard>
              </li>
            );
          })}
        </Box>
      )}
    </Stack>
  );
};

export default SessionsItemsTab;
