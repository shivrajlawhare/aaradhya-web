import { type ReactNode, useMemo, useState } from 'react';
import { Alert, Typography } from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import SessionsItemsEditor, {
  type SaveOutcome,
  type SessionsItemsEditorItem,
} from '../../components/ui/sessions-items-editor/sessions-items-editor';
import { useToast } from '../../components/ui/toast-provider';
import { type createItemBodySchema, type filteredEventResultSchema, ItemType } from '../../contract';
import { formatSessionDuration } from '../../utils/quotation-formatting';
import { getDistinctDates } from '../../utils/session-dates';
import {
  CEREMONY_EVENT_NAME_PRESETS,
  type CeremonyFormValues,
  CUSTOM_CEREMONY_EVENT_OPTION,
  CUSTOM_MEAL_NAME_OPTION,
  type FoodFormValues,
  MEAL_NAME_PRESETS,
} from '../event-creation/sessions-items-forms';
import type { WizardItemCardKind } from '../event-creation/wizard-item-actions';
import { toDateInputValue } from './date-input';
import { formatAmount } from './format-amount';
import type { MenuItemChip } from './menu-item-search';

type PublicEvent = z.infer<typeof filteredEventResultSchema>;
type SessionResult = PublicEvent['sessions'][number];
type ItemResult = NonNullable<SessionResult['items']>[number];
type ItemBody = z.infer<typeof createItemBodySchema>;

// An Event Item with every field blank still persists as a valid row (both
// reference quotations print one, STORY-071).
const BLANK_CEREMONY_TITLE = '(blank ceremony row)';
const BLANK_FOOD_TITLE = '(blank food row)';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

// "Ceremony event added." / "Food/dining event saved." / "… removed."
const TOAST_SUBJECTS: Record<WizardItemCardKind, string> = {
  ceremony: 'Ceremony event',
  food: 'Food/dining event',
};

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
  // response never includes them to begin with (Meal Items only).
  canEdit: boolean;
  onEventChanged: () => void;
}

// STORY-079 — the persisted-data counterpart to wizard step 4, on the same
// SessionsItemsEditor (V7, DEV-17): every Add/Save/Delete is an immediate,
// independent API call against the real Event (createItem/updateItem/
// deleteItem, STORY-032/033).
//
// A real Item has no date field of its own — a Session's own `items` array
// is flat, with no per-calendar-day tag surviving past the wizard's own
// pre-submission `byDate` grouping (review-step.tsx's own mapSessionsForSubmit
// already collapses it once, permanently, at Event-creation time). So unlike
// the wizard, this screen can't offer true per-day granularity within a
// multi-day Session: a Session's entire items list is shown under the one
// date tab matching its own startDate — the same convention quotation-
// document.tsx's own dateGroups already established for exactly this same
// data (STORY-071/072). A date only spanned (not started) by an ongoing
// multi-day Session shows no items of its own and no buttons (there's no
// Session to attach a new Item to on that date), just an informational note.
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

  // Sessions whose own startDate is this exact date — the "owner(s)" of
  // this tab, both for which already-saved Items show here (their entire
  // flat items list, in order — V6) and which Session a newly-added Item
  // attaches to. Two Sessions sharing a start date (STORY-071's own
  // Halad+Engagement example) both contribute their Items here; a brand-new
  // Item targets the first one, matching review-step.tsx's own
  // mapSessionsForSubmit "first Session in entry order" convention.
  const sessionsStartingOnDate = event.sessions.filter((session) => toDateInputValue(session.startDate) === activeDate);
  const dateEntries: DateEntry[] = sessionsStartingOnDate
    .flatMap((session) => (session.items ?? []).map((item) => ({ sessionId: session.id, item })))
    .filter((entry) => canEdit || entry.item.type === ItemType.Meal);
  const findEntry = (itemId: string | null) => dateEntries.find((entry) => entry.item.id === itemId);

  const toEditorItem = ({ item }: DateEntry): SessionsItemsEditorItem => {
    if (item.type === ItemType.Event) {
      return {
        kind: 'ceremony',
        id: item.id,
        title: item.eventName || BLANK_CEREMONY_TITLE,
        removeLabel: `Remove ${item.eventName || 'ceremony event'} row`,
        duration: formatSessionDuration(item.startTime ?? '', item.endTime ?? ''),
        formValues: toCeremonyFormValues(item),
      };
    }
    // costPerPlate is stripped for every role but Event Manager (STORY-046)
    // — F&B Head's read-only card shows no cost and no cost line.
    let costPerPlate: number | undefined;
    if (canEdit) {
      costPerPlate = item.costPerPlate ?? 0;
    }
    return {
      kind: 'food',
      id: item.id,
      title: item.mealName || BLANK_FOOD_TITLE,
      removeLabel: `Remove ${item.mealName || 'food event'} row`,
      pax: item.pax ?? 0,
      limitedSeating: item.limitedSeating ?? false,
      costPerPlate,
      menuItemNames: (item.menuItems ?? []).map((id) => menuItemsById.get(id) ?? id),
      menuLabel: `${item.mealName || 'Food'} menu items`,
      formValues: toFoodFormValues(item, menuItemsById),
    };
  };

  // Creates the Item on the date's first Session, or updates the one being
  // edited where it already lives.
  const saveItem = async (
    kind: WizardItemCardKind,
    buildBody: (session: SessionResult) => ItemBody,
    editingId: string | null
  ): Promise<SaveOutcome> => {
    const editingEntry = findEntry(editingId);
    const sessionId = editingEntry?.sessionId ?? sessionsStartingOnDate[0]?.id;
    const session = event.sessions.find((candidate) => candidate.id === sessionId);
    if (!session) {
      return { isSaved: false, error: GENERIC_ERROR };
    }
    const body = buildBody(session);
    try {
      if (editingEntry) {
        await updateItemMutation.mutateAsync({
          params: { id: event.id, sid: session.id, iid: editingEntry.item.id },
          body,
        });
      } else {
        await createItemMutation.mutateAsync({ params: { id: event.id, sid: session.id }, body });
      }
    } catch {
      showError(GENERIC_ERROR);
      return { isSaved: false, error: GENERIC_ERROR };
    }
    showSuccess(`${TOAST_SUBJECTS[kind]} ${editingEntry ? 'saved' : 'added'}.`);
    onEventChanged();
    return { isSaved: true };
  };

  const handleSaveCeremony = (values: CeremonyFormValues, editingId: string | null) => {
    const eventName =
      values.eventNameOption === CUSTOM_CEREMONY_EVENT_OPTION ? values.eventNameCustom.trim() : values.eventNameOption;
    // No user-facing Venue field — venue is read-only, pulled from the
    // Item's own Session, never re-entered per Item.
    return saveItem(
      'ceremony',
      (session) => ({
        type: ItemType.Event,
        eventName,
        venue: session.venue,
        startTime: values.startTime.trim() || undefined,
        endTime: values.endTime.trim() || undefined,
      }),
      editingId
    );
  };

  const handleSaveFood = async (values: FoodFormValues, editingId: string | null) => {
    const mealName =
      values.mealNameOption === CUSTOM_MEAL_NAME_OPTION ? values.mealNameCustom.trim() : values.mealNameOption;
    // A chip with an empty id is a not-yet-real Menu Item the server
    // finds-or-creates — `menuItemsById` was built before that id existed,
    // so the list is refetched after the save or the new row would render
    // the raw id.
    const hasUnresolvedChip = values.menuItems.some((chip) => chip.id === '');
    const outcome = await saveItem(
      'food',
      () => ({
        type: ItemType.Meal,
        mealName,
        pax: Number.isFinite(values.pax) ? values.pax : 0,
        costPerPlate: Number.isFinite(values.costPerPlate) ? values.costPerPlate : 0,
        limitedSeating: values.limitedSeating,
        menuItems: values.menuItems.map((chip) => (chip.id ? { id: chip.id } : { name: chip.name })),
        startTime: values.startTime.trim() || undefined,
        endTime: values.endTime.trim() || undefined,
      }),
      editingId
    );
    if (outcome.isSaved && hasUnresolvedChip) {
      menuItemsQuery.refetch();
    }
    return outcome;
  };

  const handleRemove = async (editorItem: SessionsItemsEditorItem): Promise<SaveOutcome> => {
    const entry = findEntry(editorItem.id);
    if (!entry) {
      return { isSaved: false, error: GENERIC_ERROR };
    }
    try {
      await deleteItemMutation.mutateAsync({ params: { id: event.id, sid: entry.sessionId, iid: entry.item.id } });
    } catch {
      showError(GENERIC_ERROR);
      return { isSaved: false, error: GENERIC_ERROR };
    }
    showSuccess(`${TOAST_SUBJECTS[editorItem.kind]} removed.`);
    onEventChanged();
    return { isSaved: true };
  };

  if (distinctDates.length === 0) {
    return (
      <Typography variant="bodyM">
        Add at least one Session on the Event Details tab before entering Sessions & Items.
      </Typography>
    );
  }

  let reminder: ReactNode;
  if (sessionsStartingOnDate.length === 0) {
    reminder = (
      <Alert severity="info">
        No Session starts on this date — it falls within a multi-day Session whose Items are shown under that Session's
        own start date instead.
      </Alert>
    );
  } else {
    reminder = sessionsStartingOnDate.map((session) => (
      <Alert key={session.id} severity="info">
        {session.sessionType} — Venue for this date: {session.venue}
        {formatVenueCostSuffix(session.venueCost)} (from Event Details)
      </Alert>
    ));
  }

  return (
    <SessionsItemsEditor
      dates={distinctDates}
      activeDate={activeDate}
      onSelectDate={setActiveDateState}
      reminder={reminder}
      items={dateEntries.map(toEditorItem)}
      canEdit={canEdit && sessionsStartingOnDate.length > 0}
      menuItemOptions={menuItemOptions}
      isSaving={isMutating}
      isChangeRequired
      onSaveCeremony={handleSaveCeremony}
      onSaveFood={handleSaveFood}
      onRemove={handleRemove}
    />
  );
};

export default SessionsItemsTab;
