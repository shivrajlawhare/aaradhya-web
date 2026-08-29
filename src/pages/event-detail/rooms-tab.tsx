import { useState, type ReactNode } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import { roomLineSchema, type eventResultSchema } from '../../contract';
import RoomLineRows from './room-line-rows';
import {
  dateFieldsStyles,
  footerStyles,
  footerValueStyles,
  readOnlyRoomLineStyles,
  sectionStyles,
} from './rooms-tab.styles';

type PublicEvent = z.infer<typeof eventResultSchema>;
type AccommodationResult = PublicEvent['accommodation'];
export type RoomLineFormValue = z.infer<typeof roomLineSchema>;

export interface AccommodationFormValues {
  checkIn: string;
  checkOut: string;
  roomLines: RoomLineFormValue[];
}

// Native <input type="date"> needs exactly 'YYYY-MM-DD' — the API returns a
// full ISO timestamp (or null when nothing's been entered yet).
const toDateInputValue = (isoString: string | null): string => (isoString ? isoString.slice(0, 10) : '');

const toFormRoomLines = (roomLines: AccommodationResult['roomLines']): RoomLineFormValue[] =>
  roomLines.map(({ roomType, occupancy, tariff, noOfRooms }) => ({ roomType, occupancy, tariff, noOfRooms }));

interface RoomsTabProps {
  event: PublicEvent;
  // Only an Event Manager gets working controls here — the Accommodation
  // PATCH is EventManager-only on the backend (STORY-019), same reasoning
  // OverviewTab already applies to status/Client Contacts.
  canEdit: boolean;
  onEventChanged: () => void;
}

const RoomsTab = ({ event, canEdit, onEventChanged }: RoomsTabProps) => {
  const [saveError, setSaveError] = useState<string | null>(null);
  // The last-saved server response drives every read-only computed display
  // (per-line total_incl_gst, the footer totals) — "totals shown are exactly
  // what the response returned, never independently calculated in the UI"
  // (this story's own AC). Updated directly from the mutation's own
  // response, not only once the parent's refetch (onEventChanged) resolves,
  // so totals refresh immediately on save.
  const [savedAccommodation, setSavedAccommodation] = useState<AccommodationResult>(event.accommodation);

  const { control, handleSubmit, register, reset } = useForm<AccommodationFormValues>({
    defaultValues: {
      checkIn: toDateInputValue(event.accommodation.checkIn),
      checkOut: toDateInputValue(event.accommodation.checkOut),
      roomLines: toFormRoomLines(event.accommodation.roomLines),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'roomLines' });

  const updateAccommodationMutation = tsr.updateEventAccommodation.useMutation({
    onSuccess: (response) => {
      setSaveError(null);
      setSavedAccommodation(response.body);
      reset({
        checkIn: toDateInputValue(response.body.checkIn),
        checkOut: toDateInputValue(response.body.checkOut),
        roomLines: toFormRoomLines(response.body.roomLines),
      });
      onEventChanged();
    },
    // updateEventAccommodation only declares a 404 response (matching the
    // backend contract exactly) — a schema-validation 400 (e.g. a negative
    // no_of_rooms slipping past the number input's own min={0}) isn't a
    // declared member of this route's error union, so there's no narrower
    // message to surface here; the fallback covers it honestly.
    onError: () => {
      setSaveError('Something went wrong. Please try again.');
    },
  });

  const handleAddRow = () => {
    append({ roomType: '', occupancy: 0, tariff: 0, noOfRooms: 0 });
  };

  const handleSave = handleSubmit((values) => {
    if (updateAccommodationMutation.isPending) {
      return;
    }
    setSaveError(null);
    updateAccommodationMutation.mutate({
      params: { id: event.id },
      // An empty date field sends undefined (no change), not a request to
      // clear the date — STORY-019's PATCH has no clearing capability.
      body: {
        checkIn: values.checkIn || undefined,
        checkOut: values.checkOut || undefined,
        roomLines: values.roomLines,
      },
    });
  });

  let content: ReactNode;
  if (canEdit) {
    content = (
      <>
        <Stack direction="row" sx={dateFieldsStyles}>
          <TextField
            {...register('checkIn')}
            label="Check-in"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            {...register('checkOut')}
            label="Check-out"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
        <RoomLineRows
          fields={fields}
          savedRoomLines={savedAccommodation.roomLines}
          register={register}
          onAddRow={handleAddRow}
          onRemoveRow={remove}
        />
        {saveError && (
          <Alert severity="error">
            <Typography variant="bodyM">{saveError}</Typography>
          </Alert>
        )}
        <Button variant="contained" onClick={handleSave} disabled={updateAccommodationMutation.isPending}>
          Save accommodation
        </Button>
      </>
    );
  } else {
    content = (
      <Stack sx={readOnlyRoomLineStyles}>
        <Typography variant="bodyM">
          Check-in: {toDateInputValue(savedAccommodation.checkIn) || '—'} · Check-out:{' '}
          {toDateInputValue(savedAccommodation.checkOut) || '—'}
        </Typography>
        {savedAccommodation.roomLines.map((line, index) => (
          <Typography key={index} variant="bodyM">
            {line.roomType}: {line.occupancy} occupancy × {line.noOfRooms} rooms — {line.totalInclGst}
          </Typography>
        ))}
      </Stack>
    );
  }

  return (
    <Stack sx={sectionStyles}>
      {content}
      <Stack direction="row" sx={footerStyles}>
        <Typography variant="bodyM" sx={footerValueStyles}>
          Total days: {savedAccommodation.totalDays ?? '—'}
        </Typography>
        <Typography variant="bodyM" sx={footerValueStyles}>
          Total occupancy: {savedAccommodation.totalOccupancy}
        </Typography>
        <Typography variant="bodyM" sx={footerValueStyles}>
          Total charges: {savedAccommodation.totalCharges}
        </Typography>
      </Stack>
    </Stack>
  );
};

export default RoomsTab;
