import { useState } from 'react';
import { Alert, Button, Stack, TextField, ToggleButton, Typography } from '@mui/material';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import { type filteredEventResultSchema, ItemType } from '../../contract';
import { fromPickerTime, toPickerTime } from './date-input';
import { cardStyles, totalCostStyles } from './item-card.styles';
import MenuItemSearch, { type MenuItemChip } from './menu-item-search';
import { rowStyles, timeFieldStyles, toggleActiveStyles } from './session-form.styles';

type PublicEvent = z.infer<typeof filteredEventResultSchema>;
type SessionResult = PublicEvent['sessions'][number];
// `items` is `.optional()` on the role-filtered session shape (STORY-052)
// — NonNullable since this card is only ever rendered from ItemsSection,
// itself only reachable from SessionForm's edit mode (Event Manager,
// whose own sessions always have `items` present unfiltered).
type ItemResult = NonNullable<SessionResult['items']>[number];

interface ItemFormValues {
  type: ItemType;
  mealName: string;
  pax: number;
  costPerPlate: number;
  menuItems: MenuItemChip[];
  eventName: string;
  venue: string;
  startTime: string;
  endTime: string;
}

// A stored menuItems id resolves to its display name from the full Menu
// Item list (menuItemsById) — falling back to the raw id is a defensive
// edge case only (nothing in this app deletes Menu Items), not an
// expected path.
const toItemFormValues = (item: ItemResult | undefined, menuItemsById: Map<string, string>): ItemFormValues => {
  if (!item) {
    return {
      type: ItemType.Meal,
      mealName: '',
      pax: 0,
      costPerPlate: 0,
      menuItems: [],
      eventName: '',
      venue: '',
      startTime: '',
      endTime: '',
    };
  }
  return {
    type: item.type,
    mealName: item.mealName ?? '',
    pax: item.pax ?? 0,
    costPerPlate: item.costPerPlate ?? 0,
    menuItems: item.menuItems.map((id) => ({ id, name: menuItemsById.get(id) ?? id })),
    eventName: item.eventName ?? '',
    venue: item.venue ?? '',
    startTime: item.startTime ?? '',
    endTime: item.endTime ?? '',
  };
};

interface ItemCardProps {
  eventId: string;
  sessionId: string;
  // 1-based position among the Items rendered in this Session's own
  // ItemsSection — every field label below is suffixed with it ("Pax for
  // item 1"), same "disambiguate an otherwise-repeated label by position"
  // convention RoomLineRows (STORY-018) already established. Without it,
  // two Item cards open at once (or an Item card next to the Session
  // form's own Venue/Start time/End time fields, which share the same
  // plain labels) would have colliding accessible names.
  index: number;
  // Absent = a new, not-yet-saved card (the Meal/Event toggle is offered
  // and submit calls STORY-032's POST); present = an existing Item (no
  // toggle — switching type isn't offered, matching STORY-032's own
  // updateItemBodySchema — and submit calls its PATCH).
  item?: ItemResult;
  menuItemOptions: MenuItemChip[];
  menuItemsById: Map<string, string>;
  // Called after a successful save/delete so the parent re-reads the
  // Event and this card's own displayed state (total_cost, persisted
  // menuItems) reflects what the server actually has.
  onChanged: () => void;
  // For a new, unsaved card only: discard it locally with no API call.
  onDiscardNew: () => void;
}

const ItemCard = ({
  eventId,
  sessionId,
  index,
  item,
  menuItemOptions,
  menuItemsById,
  onChanged,
  onDiscardNew,
}: ItemCardProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Drives the read-only total_cost display — updated only from a
  // mutation's own response, never computed client-side from unsaved
  // pax/cost_per_plate edits (this story's own AC).
  const [savedTotalCost, setSavedTotalCost] = useState<number | null>(item?.totalCost ?? null);
  const { control, register, handleSubmit, watch } = useForm<ItemFormValues>({
    defaultValues: toItemFormValues(item, menuItemsById),
  });
  const type = watch('type');

  const createMutation = tsr.createItem.useMutation({
    onSuccess: (response) => {
      setSavedTotalCost(response.body.totalCost);
      onChanged();
    },
    onError: () => setSubmitError('Something went wrong. Please try again.'),
  });
  const updateMutation = tsr.updateItem.useMutation({
    onSuccess: (response) => {
      setSavedTotalCost(response.body.totalCost);
      onChanged();
    },
    onError: () => setSubmitError('Something went wrong. Please try again.'),
  });
  const deleteMutation = tsr.deleteItem.useMutation({
    onSuccess: () => onChanged(),
    onError: () => setSubmitError('Something went wrong. Please try again.'),
  });
  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleSaveItem = handleSubmit((values) => {
    if (isPending) {
      return;
    }
    setSubmitError(null);

    // Each chip becomes an { id } reference (an existing Menu Item the
    // user picked) or a { name } reference (a not-found name to
    // find-or-create) — STORY-032's own endpoint resolves either shape,
    // this form never calls POST /menu-items itself.
    const menuItemsPayload = values.menuItems.map((chip) => (chip.id ? { id: chip.id } : { name: chip.name }));

    const body =
      values.type === ItemType.Meal
        ? {
            type: ItemType.Meal as const,
            mealName: values.mealName,
            pax: values.pax,
            costPerPlate: values.costPerPlate,
            menuItems: menuItemsPayload,
            startTime: values.startTime.trim() || undefined,
            endTime: values.endTime.trim() || undefined,
          }
        : {
            type: ItemType.Event as const,
            eventName: values.eventName,
            venue: values.venue,
            startTime: values.startTime.trim() || undefined,
            endTime: values.endTime.trim() || undefined,
          };

    if (item) {
      updateMutation.mutate({ params: { id: eventId, sid: sessionId, iid: item.id }, body });
    } else {
      createMutation.mutate({ params: { id: eventId, sid: sessionId }, body });
    }
  });

  // Removing an existing card calls STORY-032's DELETE immediately (this
  // story's own AC: "removes it on save... not just from local view
  // state") — there's no separate, later "save the whole form" step that
  // could forget to persist a local removal. A not-yet-saved card has
  // nothing to delete server-side, so its own "Cancel" just discards the
  // local card.
  const handleRemove = () => {
    if (!item) {
      onDiscardNew();
      return;
    }
    if (isPending) {
      return;
    }
    deleteMutation.mutate({ params: { id: eventId, sid: sessionId, iid: item.id } });
  };

  return (
    <Stack sx={cardStyles}>
      {!item && (
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Stack direction="row" sx={rowStyles}>
              <ToggleButton
                value={ItemType.Meal}
                selected={field.value === ItemType.Meal}
                onChange={() => field.onChange(ItemType.Meal)}
                sx={field.value === ItemType.Meal ? toggleActiveStyles : undefined}
              >
                Meal
              </ToggleButton>
              <ToggleButton
                value={ItemType.Event}
                selected={field.value === ItemType.Event}
                onChange={() => field.onChange(ItemType.Event)}
                sx={field.value === ItemType.Event ? toggleActiveStyles : undefined}
              >
                Event
              </ToggleButton>
            </Stack>
          )}
        />
      )}
      {type === ItemType.Meal ? (
        <>
          <TextField {...register('mealName')} label={`Meal name for item ${index}`} fullWidth />
          <Stack direction="row" sx={rowStyles}>
            <TextField
              {...register('pax', { valueAsNumber: true })}
              label={`Pax for item ${index}`}
              type="number"
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <TextField
              {...register('costPerPlate', { valueAsNumber: true })}
              label={`Cost per plate for item ${index}`}
              type="number"
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </Stack>
          <Controller
            name="menuItems"
            control={control}
            render={({ field }) => (
              <MenuItemSearch options={menuItemOptions} value={field.value} onChange={field.onChange} />
            )}
          />
        </>
      ) : (
        <>
          <TextField {...register('eventName')} label={`Event name for item ${index}`} fullWidth />
          <TextField {...register('venue')} label={`Venue for item ${index}`} fullWidth />
        </>
      )}
      {/* StaticTimePicker (STORY-057) — the always-visible clock face, not
          TimePicker's popover-only one, with an explicit AM/PM control. */}
      <Stack direction="row" sx={rowStyles}>
        <Stack sx={timeFieldStyles}>
          <Typography variant="titleM" component="h3">{`Start time for item ${index}`}</Typography>
          <Controller
            name="startTime"
            control={control}
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
          <Typography variant="titleM" component="h3">{`End time for item ${index}`}</Typography>
          <Controller
            name="endTime"
            control={control}
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
      {type === ItemType.Meal && (
        <Typography variant="bodyM" sx={totalCostStyles}>
          Total cost: {savedTotalCost ?? '—'}
        </Typography>
      )}
      {submitError && (
        <Alert severity="error">
          <Typography variant="bodyM">{submitError}</Typography>
        </Alert>
      )}
      <Stack direction="row" sx={rowStyles}>
        <Button variant="contained" onClick={handleSaveItem} disabled={isPending}>
          {item ? 'Save item' : 'Add item'}
        </Button>
        <Button onClick={handleRemove} disabled={isPending}>
          {item ? 'Remove' : 'Cancel'}
        </Button>
      </Stack>
    </Stack>
  );
};

export default ItemCard;
