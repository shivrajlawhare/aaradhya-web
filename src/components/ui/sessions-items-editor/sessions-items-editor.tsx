import { type ReactNode, useState } from 'react';
import { Stack, Tab, Tabs, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useForm } from 'react-hook-form';
import CeremonyFormCard from '../../../pages/event-creation/ceremony-form-card';
import FoodFormCard from '../../../pages/event-creation/food-form-card';
import {
  type CeremonyFormValues,
  emptyCeremonyEntry,
  emptyFoodEntry,
  type FoodFormValues,
} from '../../../pages/event-creation/sessions-items-forms';
import WizardItemActions, { type WizardItemCardKind } from '../../../pages/event-creation/wizard-item-actions';
import type { MenuItemChip } from '../../../pages/event-detail/menu-item-search';
import { formatEventDate } from '../../../utils/quotation-formatting';
import ItemCard, { type ItemCardEditableProps } from '../item-card';
import { ItemCardFoodDetails, ItemCardTime } from '../item-card-details';
import CombinedItemList from './combined-item-list';
import { dateTabsStyles, reminderListStyles, wrapperStyles } from './sessions-items-editor.styles';

const CEREMONY_TYPE_LABEL = 'Ceremony';
const FOOD_TYPE_LABEL = 'Food/dining';

interface EditorItemBase {
  id: string;
  title: string;
  removeLabel: string;
}

export interface EditorCeremonyItem extends EditorItemBase {
  kind: 'ceremony';
  // "7pm to 8pm"; empty when no times are set.
  duration: string;
  formValues: CeremonyFormValues;
}

export interface EditorFoodItem extends EditorItemBase {
  kind: 'food';
  pax: number;
  limitedSeating: boolean;
  // Absent for a role that sees no money: no cost, no cost line.
  costPerPlate?: number;
  menuItemNames: string[];
  menuLabel: string;
  formValues: FoodFormValues;
}

export type SessionsItemsEditorItem = EditorCeremonyItem | EditorFoodItem;

export interface SaveOutcome {
  isSaved: boolean;
  // Shown in the open card when the save didn't go through.
  error?: string;
}

interface SessionsItemsEditorProps {
  dates: string[];
  activeDate: string;
  onSelectDate: (date: string) => void;
  // The venue line(s) for the active date — each screen words its own.
  reminder: ReactNode;
  // The active date's Items, in add order (V6).
  items: SessionsItemsEditorItem[];
  // Off for a read-only viewer (F&B Head) or a date no Session starts on:
  // no buttons, no cards, read-only rows.
  canEdit: boolean;
  menuItemOptions: MenuItemChip[];
  isSaving: boolean;
  // The Event Detail tab's submits also wait for a change.
  isChangeRequired?: boolean;
  onSaveCeremony: (values: CeremonyFormValues, editingId: string | null) => Promise<SaveOutcome>;
  onSaveFood: (values: FoodFormValues, editingId: string | null) => Promise<SaveOutcome>;
  onRemove: (item: SessionsItemsEditorItem) => Promise<SaveOutcome>;
}

// One Sessions & Items editor for wizard step 4 and the Event Detail tab (V7,
// Figma UI-46): date tabs → venue reminder → the combined list in add order →
// the "Add Ceremony" / "Add Food/Dining Event" buttons → the one open card.
// Each screen keeps its own data source and plugs in through the callbacks.
const SessionsItemsEditor = ({
  dates,
  activeDate,
  onSelectDate,
  reminder,
  items,
  canEdit,
  menuItemOptions,
  isSaving,
  isChangeRequired = false,
  onSaveCeremony,
  onSaveFood,
  onRemove,
}: SessionsItemsEditorProps) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [openCard, setOpenCard] = useState<WizardItemCardKind | null>(null);
  const [editingCeremonyId, setEditingCeremonyId] = useState<string | null>(null);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [ceremonyError, setCeremonyError] = useState<string | null>(null);
  const [foodError, setFoodError] = useState<string | null>(null);

  const ceremonyForm = useForm<CeremonyFormValues>({ defaultValues: emptyCeremonyEntry });
  const foodForm = useForm<FoodFormValues>({ defaultValues: emptyFoodEntry });

  const resetCeremonyCard = () => {
    ceremonyForm.reset(emptyCeremonyEntry);
    setEditingCeremonyId(null);
    setCeremonyError(null);
  };

  const resetFoodCard = () => {
    foodForm.reset(emptyFoodEntry);
    setEditingFoodId(null);
    setFoodError(null);
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
    resetCeremonyCard();
    resetFoodCard();
    onSelectDate(date);
  };

  // Saving keeps the card open and empty for the next entry; a new Item lands
  // at the bottom of the list, an edited one keeps its place (V6).
  const handleSubmitCeremony = ceremonyForm.handleSubmit(async (values) => {
    setCeremonyError(null);
    const outcome = await onSaveCeremony(values, editingCeremonyId);
    if (outcome.isSaved) {
      resetCeremonyCard();
    } else {
      setCeremonyError(outcome.error ?? null);
    }
  });

  const handleSubmitFood = foodForm.handleSubmit(async (values) => {
    setFoodError(null);
    const outcome = await onSaveFood(values, editingFoodId);
    if (outcome.isSaved) {
      resetFoodCard();
    } else {
      setFoodError(outcome.error ?? null);
    }
  });

  // A row click opens its card (switching cards if needed) with its values.
  const handleEditItem = (item: SessionsItemsEditorItem) => {
    openCardOf(item.kind);
    if (item.kind === 'ceremony') {
      setEditingCeremonyId(item.id);
      setCeremonyError(null);
      ceremonyForm.reset(item.formValues);
    } else {
      setEditingFoodId(item.id);
      setFoodError(null);
      foodForm.reset(item.formValues);
    }
  };

  const editingIdOf = (kind: WizardItemCardKind) => (kind === 'ceremony' ? editingCeremonyId : editingFoodId);

  const setCardError = (kind: WizardItemCardKind, error: string | null) => {
    if (kind === 'ceremony') {
      setCeremonyError(error);
    } else {
      setFoodError(error);
    }
  };

  // Removing the row being edited also empties its card.
  const handleRemoveItem = async (item: SessionsItemsEditorItem) => {
    const outcome = await onRemove(item);
    if (!outcome.isSaved) {
      setCardError(item.kind, outcome.error ?? null);
      return;
    }
    if (editingIdOf(item.kind) === item.id) {
      resetCard(item.kind);
    }
  };

  const renderItemRow = (item: SessionsItemsEditorItem) => {
    let editable: ItemCardEditableProps | undefined;
    if (canEdit) {
      editable = {
        removeLabel: item.removeLabel,
        isEditing: editingIdOf(item.kind) === item.id,
        isRemoveDisabled: isSaving,
        onEdit: () => handleEditItem(item),
        onRemove: () => handleRemoveItem(item),
      };
    }

    if (item.kind === 'ceremony') {
      return (
        <li key={item.id}>
          <ItemCard typeLabel={CEREMONY_TYPE_LABEL} title={item.title} editable={editable}>
            <ItemCardTime duration={item.duration} />
          </ItemCard>
        </li>
      );
    }
    return (
      <li key={item.id}>
        <ItemCard typeLabel={FOOD_TYPE_LABEL} title={item.title} editable={editable}>
          <ItemCardFoodDetails
            pax={item.pax}
            limitedSeating={item.limitedSeating}
            costPerPlate={item.costPerPlate}
            menuItemNames={item.menuItemNames}
            menuLabel={item.menuLabel}
          />
        </ItemCard>
      </li>
    );
  };

  let actionsContent: ReactNode = null;
  let openCardContent: ReactNode = null;
  if (canEdit) {
    actionsContent = <WizardItemActions openCard={openCard} isDesktop={isDesktop} onToggle={handleToggleCard} />;
    if (openCard === 'ceremony') {
      openCardContent = (
        <CeremonyFormCard
          form={ceremonyForm}
          isEditing={editingCeremonyId !== null}
          isSubmitDisabled={isChangeRequired && !ceremonyForm.formState.isDirty}
          isSubmitting={isSaving}
          submitError={ceremonyError}
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
          isSubmitDisabled={isChangeRequired && !foodForm.formState.isDirty}
          isSubmitting={isSaving}
          submitError={foodError}
          onSubmit={handleSubmitFood}
          onCancelEdit={resetFoodCard}
        />
      );
    }
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
        {dates.map((date) => (
          <Tab key={date} value={date} label={formatEventDate(date)} />
        ))}
      </Tabs>

      <Stack sx={reminderListStyles}>{reminder}</Stack>

      <CombinedItemList rows={items.map(renderItemRow)} />

      {actionsContent}

      {openCardContent}
    </Stack>
  );
};

export default SessionsItemsEditor;
