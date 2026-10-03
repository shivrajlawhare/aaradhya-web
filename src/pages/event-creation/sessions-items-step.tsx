import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Alert, Typography } from '@mui/material';
import { tsr } from '../../api/client';
import SessionsItemsEditor, {
  type SaveOutcome,
  type SessionsItemsEditorItem,
} from '../../components/ui/sessions-items-editor/sessions-items-editor';
import { ItemType } from '../../contract';
import { useEventWizard } from '../../stores/event-wizard-context';
import { formatSessionDuration } from '../../utils/quotation-formatting';
import { getDistinctDates } from '../../utils/session-dates';
import { formatAmount } from '../event-detail/format-amount';
import type { MenuItemChip } from '../event-detail/menu-item-search';
import type { WizardSessionRow } from './event-details-step';
import {
  type CeremonyFormValues,
  CUSTOM_CEREMONY_EVENT_OPTION,
  CUSTOM_MEAL_NAME_OPTION,
  type FoodFormValues,
  toCeremonyFormValues,
  toFoodFormValues,
  type WizardDateEntry,
} from './sessions-items-forms';

export type { WizardCeremonyItem, WizardDateEntry, WizardFoodItem } from './sessions-items-forms';

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

// An Event Item with every field blank still persists as a valid row (both
// reference quotations print one) — this is the wizard-entry-time
// equivalent of that bare grey divider row.
const BLANK_CEREMONY_TITLE = '(blank ceremony row)';
const BLANK_FOOD_TITLE = '(blank food row)';

const SAVED: SaveOutcome = { isSaved: true };

// Time+random, not a module-level counter — same reasoning as
// client-details-step.tsx's own createRowId.
const createRowId = (): string => `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const toEditorItem = (entry: WizardDateEntry): SessionsItemsEditorItem => {
  if (entry.type === ItemType.Event) {
    return {
      kind: 'ceremony',
      id: entry.id,
      title: entry.eventName || BLANK_CEREMONY_TITLE,
      removeLabel: `Remove ${entry.eventName || 'ceremony event'} row`,
      duration: formatSessionDuration(entry.startTime, entry.endTime),
      formValues: toCeremonyFormValues(entry),
    };
  }
  return {
    kind: 'food',
    id: entry.id,
    title: entry.mealName || BLANK_FOOD_TITLE,
    removeLabel: `Remove ${entry.mealName || 'food event'} row`,
    pax: entry.pax,
    limitedSeating: entry.limitedSeating,
    costPerPlate: entry.costPerPlate,
    menuItemNames: entry.menuItems.map((menuItem) => menuItem.name),
    menuLabel: `${entry.mealName || 'Food'} menu items`,
    formValues: toFoodFormValues(entry),
  };
};

// Wizard Step 4 (STORY-067; DEV-17 shared editor). Date tabs derived from
// Step 2's own Sessions; the date's Items are kept in add order and mirrored
// into the wizard store on every change.
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
  };

  const activeDateEntries = byDate[activeDate] ?? [];
  const activeDateSessions = sessions.filter(
    (session) => activeDate >= session.startDate && activeDate <= session.endDate
  );

  // Adds a new row at the bottom, or replaces the row being edited in place
  // (V6).
  const upsertActiveDateEntry = (item: WizardDateEntry, editingId: string | null) => {
    setByDate((current) => {
      const existing = current[activeDate] ?? [];
      const next = editingId ? existing.map((entry) => (entry.id === editingId ? item : entry)) : [...existing, item];
      return { ...current, [activeDate]: next };
    });
  };

  const handleSaveCeremony = (values: CeremonyFormValues, editingId: string | null): Promise<SaveOutcome> => {
    const eventName =
      values.eventNameOption === CUSTOM_CEREMONY_EVENT_OPTION ? values.eventNameCustom.trim() : values.eventNameOption;
    upsertActiveDateEntry(
      {
        id: editingId ?? createRowId(),
        type: ItemType.Event,
        eventName,
        startTime: values.startTime,
        endTime: values.endTime,
      },
      editingId
    );
    return Promise.resolve(SAVED);
  };

  // Each chip with an empty id is a not-yet-real Menu Item the user typed
  // with no existing match — persisted for real here (unlike the Sessions
  // & Items tab, which defers resolution to createItem/updateItem's own
  // server-side find-or-create) since the
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
          (option) => option.name.trim().toLowerCase() === chip.name.trim().toLowerCase()
        );
        if (!match) {
          return null;
        }
        resolved.push({ id: match.id, name: match.name });
      }
    }
    return resolved;
  };

  const handleSaveFood = async (values: FoodFormValues, editingId: string | null): Promise<SaveOutcome> => {
    const mealName =
      values.mealNameOption === CUSTOM_MEAL_NAME_OPTION ? values.mealNameCustom.trim() : values.mealNameOption;
    const hadNewChips = values.menuItems.some((chip) => chip.id === '');
    const resolvedMenuItems = await resolveMenuItemChips(values.menuItems);
    if (resolvedMenuItems === null) {
      return { isSaved: false, error: 'Something went wrong adding a new menu item. Please try again.' };
    }
    if (hadNewChips) {
      menuItemsQuery.refetch();
    }

    upsertActiveDateEntry(
      {
        id: editingId ?? createRowId(),
        type: ItemType.Meal,
        mealName,
        startTime: values.startTime,
        endTime: values.endTime,
        // A cleared number input's valueAsNumber is NaN, not 0 — stored
        // as-is it would round-trip through sessionStorage's JSON.stringify
        // as null, corrupting formatQuotationPax's own "Npax" display. Same
        // "blank number field means 0" fallback accommodation-step.tsx's
        // own handleNumberFieldChange already applies.
        pax: Number.isFinite(values.pax) ? values.pax : 0,
        limitedSeating: values.limitedSeating,
        costPerPlate: Number.isFinite(values.costPerPlate) ? values.costPerPlate : 0,
        menuItems: resolvedMenuItems,
      },
      editingId
    );
    return SAVED;
  };

  const handleRemove = (item: SessionsItemsEditorItem): Promise<SaveOutcome> => {
    setByDate((current) => ({
      ...current,
      [activeDate]: (current[activeDate] ?? []).filter((entry) => entry.id !== item.id),
    }));
    return Promise.resolve(SAVED);
  };

  if (distinctDates.length === 0) {
    return (
      <Typography variant="bodyM">
        Add at least one Session in Event Details before entering Sessions & Items.
      </Typography>
    );
  }

  let reminder: ReactNode;
  if (activeDateSessions.length === 0) {
    reminder = <Alert severity="info">No Session from Event Details covers this date.</Alert>;
  } else {
    reminder = activeDateSessions.map((session) => (
      <Alert key={session.id} severity="info">
        {session.sessionType} — Venue for this date: {session.venue} · {formatAmount(session.venueCost)}/- (from Event
        Details)
      </Alert>
    ));
  }

  return (
    <SessionsItemsEditor
      dates={distinctDates}
      activeDate={activeDate}
      onSelectDate={handleSelectDate}
      reminder={reminder}
      items={activeDateEntries.map(toEditorItem)}
      canEdit
      menuItemOptions={menuItemOptions}
      isSaving={createMenuItemMutation.isPending}
      onSaveCeremony={handleSaveCeremony}
      onSaveFood={handleSaveFood}
      onRemove={handleRemove}
    />
  );
};

export default SessionsItemsStep;
