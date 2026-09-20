import { useState, type ReactNode } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import { roomLineSchema, type filteredAccommodationResultSchema } from '../../contract';
import { formatAmount } from './format-amount';
import { fromPickerDate, toDateInputValue, toPickerDate } from './date-input';
import { formatEventDate } from '../../utils/quotation-formatting';
import RoomLineRows from './room-line-rows';
import {
  dateFieldsStyles,
  footerCellStyles,
  footerStyles,
  formCardStyles,
  readOnlyRoomLineStyles,
  sectionStyles,
  summaryLineStyles,
} from './rooms-tab.styles';

// The role-filtered shape (STORY-052) — this tab is now reached by
// Housekeeping/Reception too, not just Event Manager, and those two roles
// see accommodation with its money fields (tariff/totalInclGst/
// totalCharges) already stripped (STORY-046). Every read of one of those
// three fields below falls back to '—' rather than the previous direct
// interpolation, which would have rendered the literal text "undefined"
// once a role other than Event Manager could actually reach the read-only
// branch (nothing caught this earlier since only Event Manager, who always
// has all three, ever opened this tab before this story).
type AccommodationResult = z.infer<typeof filteredAccommodationResultSchema>;
export type RoomLineFormValue = z.infer<typeof roomLineSchema>;

export interface AccommodationFormValues {
  checkIn: string;
  checkOut: string;
  roomLines: RoomLineFormValue[];
}

// tariff defaults to 0 — this form is only ever populated from the
// `canEdit` (Event Manager) branch below, whose own accommodation always
// has every room line's tariff present unfiltered; the fallback exists
// purely to satisfy `AccommodationResult`'s now-`.optional()` tariff
// (STORY-052), not a real state this path is ever built from.
const toFormRoomLines = (roomLines: AccommodationResult['roomLines']): RoomLineFormValue[] =>
  roomLines.map(({ roomType, occupancy, tariff, noOfRooms }) => ({
    roomType,
    occupancy,
    tariff: tariff ?? 0,
    noOfRooms,
  }));

interface RoomsTabProps {
  eventId: string;
  // Required, not the Event's own `.optional()` field (STORY-052) — this
  // tab is only ever mounted from event-detail-page.tsx's own
  // `canSeeRooms && event.accommodation &&` gate, which has already
  // narrowed it to present; same reasoning TotalCostSummaryPanel's own
  // `extras` prop documents.
  accommodation: AccommodationResult;
  // Only an Event Manager gets working controls here — the Accommodation
  // PATCH is EventManager-only on the backend (STORY-019), same reasoning
  // OverviewTab already applies to status/Client Contacts.
  canEdit: boolean;
  onEventChanged: () => void;
}

const RoomsTab = ({ eventId, accommodation, canEdit, onEventChanged }: RoomsTabProps) => {
  const [saveError, setSaveError] = useState<string | null>(null);
  // The last-saved server response drives every read-only computed display
  // (per-line total_incl_gst, the footer totals) — "totals shown are exactly
  // what the response returned, never independently calculated in the UI"
  // (this story's own AC). Updated directly from the mutation's own
  // response, not only once the parent's refetch (onEventChanged) resolves,
  // so totals refresh immediately on save.
  const [savedAccommodation, setSavedAccommodation] = useState<AccommodationResult>(accommodation);

  const { control, handleSubmit, register, reset } = useForm<AccommodationFormValues>({
    defaultValues: {
      checkIn: toDateInputValue(accommodation.checkIn),
      checkOut: toDateInputValue(accommodation.checkOut),
      roomLines: toFormRoomLines(accommodation.roomLines),
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
      params: { id: eventId },
      // An empty date field sends undefined (no change), not a request to
      // clear the date — STORY-019's PATCH has no clearing capability.
      body: {
        checkIn: values.checkIn || undefined,
        checkOut: values.checkOut || undefined,
        roomLines: values.roomLines,
      },
    });
  });

  // "<check-in> to <check-out> · Total days: N" — matches
  // accommodation-step.tsx's own summary line exactly, right down to the
  // '—' fallback for an unset date/undetermined total, so the Rooms tab and
  // the wizard's Accommodation step read the same way.
  const summaryLine = (
    <Typography variant="bodyM" sx={summaryLineStyles}>
      {toDateInputValue(savedAccommodation.checkIn) ? formatEventDate(toDateInputValue(savedAccommodation.checkIn)) : '—'}
      {' to '}
      {toDateInputValue(savedAccommodation.checkOut) ? formatEventDate(toDateInputValue(savedAccommodation.checkOut)) : '—'}
      {' · Total days: '}
      {savedAccommodation.totalDays ?? '—'}
    </Typography>
  );

  let content: ReactNode;
  if (canEdit) {
    content = (
      <>
        <Paper elevation={0} sx={formCardStyles}>
          <Typography variant="titleM" component="h2">
            Accommodation
          </Typography>
          <Stack direction="row" sx={dateFieldsStyles}>
            <Controller
              name="checkIn"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Check-in"
                  value={toPickerDate(field.value)}
                  onChange={(date) => field.onChange(fromPickerDate(date))}
                  slotProps={{ textField: { onBlur: field.onBlur } }}
                />
              )}
            />
            <Controller
              name="checkOut"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Check-out"
                  value={toPickerDate(field.value)}
                  onChange={(date) => field.onChange(fromPickerDate(date))}
                  slotProps={{ textField: { onBlur: field.onBlur } }}
                />
              )}
            />
          </Stack>
          {summaryLine}
        </Paper>
        <RoomLineRows
          fields={fields}
          // Only reached in the canEdit (Event Manager) branch, whose own
          // accommodation always has every line's tariff/totalInclGst
          // present unfiltered — the `?? 0` fallbacks exist purely to
          // satisfy RoomLineRows' own stricter, edit-form-shaped type,
          // same reasoning toFormRoomLines' own tariff fallback documents.
          savedRoomLines={savedAccommodation.roomLines.map((line) => ({
            ...line,
            tariff: line.tariff ?? 0,
            totalInclGst: line.totalInclGst ?? 0,
          }))}
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
      <Paper elevation={0} sx={formCardStyles}>
        <Typography variant="titleM" component="h2">
          Accommodation
        </Typography>
        {summaryLine}
        <Stack sx={readOnlyRoomLineStyles}>
          {savedAccommodation.roomLines.map((line, index) => (
            <Typography key={index} variant="bodyM">
              {/* totalInclGst is money — stripped for Housekeeping/Reception
                  (STORY-046), so "—" here, not the literal text "undefined". */}
              {line.roomType}: {line.occupancy} occupancy × {line.noOfRooms} rooms — {line.totalInclGst ?? '—'}
            </Typography>
          ))}
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack sx={sectionStyles}>
      {content}
      <Stack direction="row" sx={footerStyles}>
        <Typography variant="bodyM" sx={footerCellStyles('occupancy')}>
          Total Occupancy: {savedAccommodation.totalOccupancy}
        </Typography>
        <Typography variant="bodyM" sx={footerCellStyles('charges')}>
          Total Charges: {savedAccommodation.totalCharges !== undefined ? formatAmount(savedAccommodation.totalCharges) : '—'}
        </Typography>
      </Stack>
    </Stack>
  );
};

export default RoomsTab;
