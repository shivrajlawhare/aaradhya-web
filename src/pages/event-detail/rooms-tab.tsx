import { type ReactNode, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import AccommodationTotals from '../../components/ui/accommodation-totals';
import DiscountPercentField from '../../components/ui/discount-percent-field';
import { useToast } from '../../components/ui/toast-provider';
import { type filteredAccommodationResultSchema, roomLineSchema, type roomTypeResultSchema } from '../../contract';
import { parseDiscountPercent } from '../../utils/accommodation-calculations';
import { formatEventDate } from '../../utils/quotation-formatting';
import { fromPickerDate, toDateInputValue, toPickerDate } from './date-input';
import { formatAmount } from './format-amount';
import RoomLineRows from './room-line-rows';
import {
  dateFieldsStyles,
  dateFieldStyles,
  occupancyOnlyStyles,
  readOnlyRoomLineStyles,
  summaryLineStyles,
} from './rooms-tab.styles';
import { tabActionStyles, tabCardStyles, tabSectionStyles } from './tab-card.styles';

// The role-filtered shape (STORY-052) — this tab is now reached by
// Housekeeping/Reception too, not just Event Manager, and those two roles
// see accommodation with its money fields (tariff/totalTaxable/
// totalCharges/discount/finalAmount) already stripped (STORY-046). Every
// read of one of those fields below falls back to '—' (or hides the money
// totals) rather than rendering the literal text "undefined".
type AccommodationResult = z.infer<typeof filteredAccommodationResultSchema>;
export type RoomLineFormValue = z.infer<typeof roomLineSchema>;

export interface AccommodationFormValues {
  checkIn: string;
  checkOut: string;
  roomLines: RoomLineFormValue[];
  // The Discount (%) field's raw text (DEV-07), parsed on submit.
  discountPercent: string;
}

type RoomTypeMasterEntry = z.infer<typeof roomTypeResultSchema>;

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

const toFormValues = (accommodation: AccommodationResult): AccommodationFormValues => ({
  checkIn: toDateInputValue(accommodation.checkIn),
  checkOut: toDateInputValue(accommodation.checkOut),
  roomLines: toFormRoomLines(accommodation.roomLines),
  discountPercent: String(accommodation.discountPercent ?? 0),
});

const normaliseRoomTypeName = (name: string): string => name.trim().toLowerCase();

// A room line's read-only occupancy, resolved the way the server snapshots
// it on save (DEV-07): the Room Type master entry with that name
// (case-insensitive, an active one preferred); else the line's own saved
// occupancy if its room type is unchanged; else null (shown as "—").
const resolveRoomLineOccupancy = (
  roomType: string,
  roomTypes: RoomTypeMasterEntry[],
  savedLine: RoomLineFormValue | undefined
): number | null => {
  const matches = roomTypes.filter((entry) => normaliseRoomTypeName(entry.name) === normaliseRoomTypeName(roomType));
  const master = matches.find((entry) => entry.active) ?? matches[0];
  if (master) {
    return master.occupancy;
  }
  return savedLine && savedLine.roomType === roomType ? savedLine.occupancy : null;
};

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
  const { showSuccess, showError } = useToast();
  const [saveError, setSaveError] = useState<string | null>(null);
  // The last-saved server response drives every read-only computed display
  // (per-line total_taxable, the totals block) — "totals shown are exactly
  // what the response returned, never independently calculated in the UI"
  // (STORY-019's AC). Updated directly from the mutation's own response,
  // not only once the parent's refetch (onEventChanged) resolves, so totals
  // refresh immediately on save.
  const [savedAccommodation, setSavedAccommodation] = useState<AccommodationResult>(accommodation);

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { isDirty },
  } = useForm<AccommodationFormValues>({ defaultValues: toFormValues(accommodation) });
  const { fields, append, remove } = useFieldArray({ control, name: 'roomLines' });
  const watchedRoomLines = useWatch({ control, name: 'roomLines' });

  // Only the editor needs the master — read-only roles see the saved
  // snapshot as is.
  const roomTypesQuery = tsr.listRoomTypes.useQuery({ queryKey: ['room-types'], enabled: canEdit });
  const roomTypes = roomTypesQuery.data?.body ?? [];
  const savedFormRoomLines = toFormRoomLines(savedAccommodation.roomLines);
  const occupancies = watchedRoomLines.map((line, index) =>
    resolveRoomLineOccupancy(line.roomType, roomTypes, savedFormRoomLines[index])
  );

  const updateAccommodationMutation = tsr.updateEventAccommodation.useMutation({
    onSuccess: (response) => {
      setSaveError(null);
      setSavedAccommodation(response.body);
      reset(toFormValues(response.body));
      showSuccess('Accommodation saved.');
      onEventChanged();
    },
    // updateEventAccommodation only declares a 404 response (matching the
    // backend contract exactly) — a schema-validation 400 (e.g. a negative
    // no_of_rooms slipping past the number input's own min={0}) isn't a
    // declared member of this route's error union, so there's no narrower
    // message to surface here; the fallback covers it honestly.
    onError: () => {
      setSaveError('Something went wrong. Please try again.');
      showError('Something went wrong. Please try again.');
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
        // The server overwrites occupancy from the master anyway; sending
        // the resolved value keeps the request honest.
        roomLines: values.roomLines.map((line, index) => ({
          ...line,
          occupancy: occupancies[index] ?? line.occupancy,
        })),
        // Validated by the field's own rule below, so never null here.
        discountPercent: parseDiscountPercent(values.discountPercent) ?? 0,
      },
    });
  });

  // "<check-in> to <check-out> · Total nights: N" — matches
  // accommodation-step.tsx's own summary line, right down to the '—'
  // fallback for an unset date/undetermined total.
  const summaryLine = (
    <Typography variant="bodyM" sx={summaryLineStyles}>
      {toDateInputValue(savedAccommodation.checkIn)
        ? formatEventDate(toDateInputValue(savedAccommodation.checkIn))
        : '—'}
      {' to '}
      {toDateInputValue(savedAccommodation.checkOut)
        ? formatEventDate(toDateInputValue(savedAccommodation.checkOut))
        : '—'}
      {' · Total nights: '}
      {savedAccommodation.totalNights ?? '—'}
    </Typography>
  );

  const discountField = canEdit ? (
    <Controller
      name="discountPercent"
      control={control}
      rules={{ validate: (value) => parseDiscountPercent(value) !== null }}
      render={({ field }) => (
        <DiscountPercentField
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          inputRef={field.ref}
          isInvalid={parseDiscountPercent(field.value) === null}
        />
      )}
    />
  ) : undefined;

  // Money is stripped for Housekeeping/Reception — they see the occupancy
  // and a "—" for the charges (Figma UI-40).
  const { totalCharges, discountAmount, finalAmount } = savedAccommodation;
  const totals =
    totalCharges !== undefined && discountAmount !== undefined && finalAmount !== undefined ? (
      <AccommodationTotals
        totals={{
          totalOccupancy: savedAccommodation.totalOccupancy,
          totalCharges,
          discountPercent: savedAccommodation.discountPercent ?? 0,
          discountAmount,
          finalAmount,
        }}
        formatMoney={formatAmount}
        discountField={discountField}
      />
    ) : (
      <Stack sx={occupancyOnlyStyles}>
        <Typography variant="bodyM">Total Occupancy: {savedAccommodation.totalOccupancy}</Typography>
        <Typography variant="bodyM">Total Charges: —</Typography>
      </Stack>
    );

  let content: ReactNode;
  if (canEdit) {
    content = (
      <>
        <Paper elevation={0} sx={tabCardStyles}>
          <Typography variant="titleM" component="h2">
            Accommodation
          </Typography>
          <Box sx={dateFieldsStyles}>
            <Controller
              name="checkIn"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Check-in"
                  value={toPickerDate(field.value)}
                  onChange={(date) => field.onChange(fromPickerDate(date))}
                  slotProps={{ textField: { onBlur: field.onBlur, sx: dateFieldStyles } }}
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
                  slotProps={{ textField: { onBlur: field.onBlur, sx: dateFieldStyles } }}
                />
              )}
            />
          </Box>
          {summaryLine}
        </Paper>
        <RoomLineRows
          fields={fields}
          // Only reached in the canEdit (Event Manager) branch, whose own
          // accommodation always has every line's tariff/totalTaxable
          // present unfiltered — the `?? 0` fallbacks exist purely to
          // satisfy RoomLineRows' own stricter, edit-form-shaped type,
          // same reasoning toFormRoomLines' own tariff fallback documents.
          savedRoomLines={savedAccommodation.roomLines.map((line) => ({
            ...line,
            tariff: line.tariff ?? 0,
            totalTaxable: line.totalTaxable ?? 0,
          }))}
          occupancies={occupancies}
          register={register}
          onAddRow={handleAddRow}
          onRemoveRow={remove}
        />
        {totals}
        {saveError && (
          <Alert severity="error">
            <Typography variant="bodyM">{saveError}</Typography>
          </Alert>
        )}
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!isDirty || updateAccommodationMutation.isPending}
          sx={tabActionStyles}
        >
          Save accommodation
        </Button>
      </>
    );
  } else {
    content = (
      <>
        <Paper elevation={0} sx={tabCardStyles}>
          <Typography variant="titleM" component="h2">
            Accommodation
          </Typography>
          {summaryLine}
          <Stack sx={readOnlyRoomLineStyles}>
            {savedAccommodation.roomLines.map((line, index) => (
              <Typography key={index} variant="bodyM">
                {/* totalTaxable is money — stripped for Housekeeping/
                    Reception (STORY-046), so "—" here, not "undefined". */}
                {line.roomType}: {line.occupancy} occupancy × {line.noOfRooms} rooms — {line.totalTaxable ?? '—'}
              </Typography>
            ))}
          </Stack>
        </Paper>
        {totals}
      </>
    );
  }

  return <Stack sx={tabSectionStyles}>{content}</Stack>;
};

export default RoomsTab;
