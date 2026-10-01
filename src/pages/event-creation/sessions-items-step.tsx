import { type ReactNode, useEffect, useMemo, useState } from 'react';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import { Alert, Box, Chip, Stack, Tab, Tabs, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useForm } from 'react-hook-form';
import { tsr } from '../../api/client';
import { ItemType } from '../../contract';
import { useEventWizard } from '../../stores/event-wizard-context';
import { formatEventDate, formatQuotationPax, formatSessionDuration } from '../../utils/quotation-formatting';
import { getDistinctDates } from '../../utils/session-dates';
import { formatAmount } from '../event-detail/format-amount';
import type { MenuItemChip } from '../event-detail/menu-item-search';
import CeremonyFormCard from './ceremony-form-card';
import type { WizardSessionRow } from './event-details-step';
import FoodFormCard from './food-form-card';
import {
  type CeremonyFormValues,
  CUSTOM_CEREMONY_EVENT_OPTION,
  CUSTOM_MEAL_NAME_OPTION,
  emptyCeremonyEntry,
  emptyFoodEntry,
  type FoodFormValues,
  toCeremonyFormValues,
  toFoodFormValues,
  type WizardCeremonyItem,
  type WizardDateEntry,
  type WizardFoodItem,
} from './sessions-items-forms';
import { dateTabsStyles, reminderListStyles, wrapperStyles } from './sessions-items-step.styles';
import WizardItemActions, { type WizardItemCardKind } from './wizard-item-actions';
import WizardItemCard from './wizard-item-card';
import {
  chipListStyles,
  chipStyles,
  detailIconStyles,
  detailLineStyles,
  detailStyles,
} from './wizard-item-card.styles';
import WizardItemGroup from './wizard-item-group';

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

// Time+random, not a module-level counter — same reasoning as
// client-details-step.tsx's own createRowId.
const createRowId = (): string => `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Wizard Step 4 (STORY-067; D6 two-button pattern, DEV-08). Date tabs
// derived from Step 2's own Sessions; a sticky "Add Ceremony" / "Add
// Food/Dining Event" row opens one card at a time; per-date rows are
// grouped below and mirrored into the wizard store on every change.
const SessionsItemsStep = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
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

  const [openCard, setOpenCard] = useState<WizardItemCardKind | null>(null);
  const [editingCeremonyId, setEditingCeremonyId] = useState<string | null>(null);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [foodSubmitError, setFoodSubmitError] = useState<string | null>(null);

  const ceremonyForm = useForm<CeremonyFormValues>({ defaultValues: emptyCeremonyEntry });
  const foodForm = useForm<FoodFormValues>({ defaultValues: emptyFoodEntry });

  // The full Menu Item master list, fetched once here rather than
  // per-keystroke — same reasoning items-section.tsx's own identical query
  // documents.
  const menuItemsQuery = tsr.listMenuItems.useQuery({ queryKey: ['menu-items'], queryData: { query: {} } });
  const menuItemOptions: MenuItemChip[] = (menuItemsQuery.data?.body ?? []).map((menuItem) => ({
    id: menuItem.id,
    name: menuItem.name,
  }));
  const createMenuItemMutation = tsr.createMenuItem.useMutation();

  const resetCeremonyCard = () => {
    ceremonyForm.reset(emptyCeremonyEntry);
    setEditingCeremonyId(null);
  };

  const resetFoodCard = () => {
    foodForm.reset(emptyFoodEntry);
    setEditingFoodId(null);
    setFoodSubmitError(null);
  };

  const resetCard = (kind: WizardItemCardKind) => {
    if (kind === 'ceremony') {
      resetCeremonyCard();
    } else {
      resetFoodCard();
    }
  };

  // Opens a card, closing (and clearing) the other one — one card at a time.
  const openCardOf = (kind: WizardItemCardKind) => {
    if (openCard && openCard !== kind) {
      resetCard(openCard);
    }
    setOpenCard(kind);
  };

  // The open card's own button closes it; the other button switches cards.
  const handleToggleCard = (kind: WizardItemCardKind) => {
    if (openCard === kind) {
      resetCard(kind);
      setOpenCard(null);
      return;
    }
    openCardOf(kind);
  };

  const handleSelectDate = (date: string) => {
    setActiveDate(date);
    setVisitedDates((current) => (current.includes(date) ? current : [...current, date]));
    resetCeremonyCard();
    resetFoodCard();
  };

  const activeDateEntries = byDate[activeDate] ?? [];
  const ceremonyEntries = activeDateEntries.filter(
    (entry): entry is WizardCeremonyItem => entry.type === ItemType.Event
  );
  const foodEntries = activeDateEntries.filter((entry): entry is WizardFoodItem => entry.type === ItemType.Meal);
  const activeDateSessions = sessions.filter(
    (session) => activeDate >= session.startDate && activeDate <= session.endDate
  );

  // Adds a new row, or replaces the row being edited in place; either way
  // the card stays open and empty for the next entry.
  const upsertActiveDateEntry = (item: WizardDateEntry, editingId: string | null) => {
    setByDate((current) => {
      const existing = current[activeDate] ?? [];
      const next = editingId ? existing.map((entry) => (entry.id === editingId ? item : entry)) : [...existing, item];
      return { ...current, [activeDate]: next };
    });
  };

  const removeActiveDateEntry = (id: string) => {
    setByDate((current) => ({
      ...current,
      [activeDate]: (current[activeDate] ?? []).filter((entry) => entry.id !== id),
    }));
  };

  const handleSubmitCeremony = ceremonyForm.handleSubmit((values) => {
    const eventName =
      values.eventNameOption === CUSTOM_CEREMONY_EVENT_OPTION ? values.eventNameCustom.trim() : values.eventNameOption;
    upsertActiveDateEntry(
      {
        id: editingCeremonyId ?? createRowId(),
        type: ItemType.Event,
        eventName,
        startTime: values.startTime,
        endTime: values.endTime,
      },
      editingCeremonyId
    );
    resetCeremonyCard();
  });

  const handleEditCeremonyRow = (item: WizardCeremonyItem) => {
    openCardOf('ceremony');
    setEditingCeremonyId(item.id);
    ceremonyForm.reset(toCeremonyFormValues(item));
  };

  const handleRemoveCeremonyRow = (id: string) => {
    removeActiveDateEntry(id);
    if (editingCeremonyId === id) {
      resetCeremonyCard();
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

  const handleSubmitFood = foodForm.handleSubmit(async (values) => {
    setFoodSubmitError(null);
    const mealName =
      values.mealNameOption === CUSTOM_MEAL_NAME_OPTION ? values.mealNameCustom.trim() : values.mealNameOption;
    const hadNewChips = values.menuItems.some((chip) => chip.id === '');
    const resolvedMenuItems = await resolveMenuItemChips(values.menuItems);
    if (resolvedMenuItems === null) {
      setFoodSubmitError('Something went wrong adding a new menu item. Please try again.');
      return;
    }
    if (hadNewChips) {
      menuItemsQuery.refetch();
    }

    upsertActiveDateEntry(
      {
        id: editingFoodId ?? createRowId(),
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
      editingFoodId
    );
    resetFoodCard();
  });

  const handleEditFoodRow = (item: WizardFoodItem) => {
    openCardOf('food');
    setEditingFoodId(item.id);
    setFoodSubmitError(null);
    foodForm.reset(toFoodFormValues(item));
  };

  const handleRemoveFoodRow = (id: string) => {
    removeActiveDateEntry(id);
    if (editingFoodId === id) {
      resetFoodCard();
    }
  };

  if (distinctDates.length === 0) {
    return (
      <Typography variant="bodyM">
        Add at least one Session in Event Details before entering Sessions & Items.
      </Typography>
    );
  }

  let reminderContent: ReactNode;
  if (activeDateSessions.length === 0) {
    reminderContent = <Alert severity="info">No Session from Event Details covers this date.</Alert>;
  } else {
    reminderContent = activeDateSessions.map((session) => (
      <Alert key={session.id} severity="info">
        {session.sessionType} — Venue for this date: {session.venue} · {formatAmount(session.venueCost)}/- (from Event
        Details)
      </Alert>
    ));
  }

  let openCardContent: ReactNode = null;
  if (openCard === 'ceremony') {
    openCardContent = (
      <CeremonyFormCard
        form={ceremonyForm}
        isEditing={editingCeremonyId !== null}
        onSubmit={handleSubmitCeremony}
        onCancelEdit={resetCeremonyCard}
      />
    );
  } else if (openCard === 'food') {
    openCardContent = (
      <FoodFormCard
        form={foodForm}
        menuItemOptions={menuItemOptions}
        isEditing={editingFoodId !== null}
        isSubmitting={createMenuItemMutation.isPending}
        submitError={foodSubmitError}
        onSubmit={handleSubmitFood}
        onCancelEdit={resetFoodCard}
      />
    );
  }

  return (
    <Stack sx={wrapperStyles}>
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

      <WizardItemActions openCard={openCard} isDesktop={isDesktop} onToggle={handleToggleCard} />

      {openCardContent}

      <WizardItemGroup label="Ceremony events" emptyText="No ceremony events yet" count={ceremonyEntries.length}>
        {ceremonyEntries.map((item) => {
          const duration = formatSessionDuration(item.startTime, item.endTime);
          return (
            <WizardItemCard
              key={item.id}
              title={item.eventName || BLANK_CEREMONY_TITLE}
              removeLabel={`Remove ${item.eventName || 'ceremony event'} row`}
              isEditing={editingCeremonyId === item.id}
              onEdit={() => handleEditCeremonyRow(item)}
              onRemove={() => handleRemoveCeremonyRow(item.id)}
            >
              {duration && (
                <Box sx={detailLineStyles}>
                  <Box component="span" sx={detailStyles}>
                    <ScheduleOutlinedIcon aria-hidden sx={detailIconStyles} />
                    <Typography variant="bodyS" component="span">
                      {duration}
                    </Typography>
                  </Box>
                </Box>
              )}
            </WizardItemCard>
          );
        })}
      </WizardItemGroup>

      <WizardItemGroup label="Food/dining events" emptyText="No food/dining events yet" count={foodEntries.length}>
        {foodEntries.map((item) => (
          <WizardItemCard
            key={item.id}
            title={item.mealName || BLANK_FOOD_TITLE}
            removeLabel={`Remove ${item.mealName || 'food event'} row`}
            isEditing={editingFoodId === item.id}
            onEdit={() => handleEditFoodRow(item)}
            onRemove={() => handleRemoveFoodRow(item.id)}
          >
            <Box sx={detailLineStyles}>
              <Box component="span" sx={detailStyles}>
                <GroupsOutlinedIcon aria-hidden sx={detailIconStyles} />
                <Typography variant="bodyS" component="span">
                  {formatQuotationPax(item.pax, item.limitedSeating)}
                </Typography>
              </Box>
              <Typography variant="bodyS" component="span">
                ₹ {formatAmount(item.costPerPlate)}
              </Typography>
            </Box>
            {item.menuItems.length > 0 && (
              <Box component="ul" aria-label={`${item.mealName || 'Food'} menu items`} sx={chipListStyles}>
                {item.menuItems.map((menuItem) => (
                  <li key={menuItem.id || menuItem.name}>
                    <Chip size="small" label={menuItem.name} sx={chipStyles} />
                  </li>
                ))}
              </Box>
            )}
          </WizardItemCard>
        ))}
      </WizardItemGroup>
    </Stack>
  );
};

export default SessionsItemsStep;
