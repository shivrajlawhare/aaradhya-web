import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import type { paymentResultSchema } from '../../contract';
import { fromPickerDate, toDateInputValue, toPickerDate } from './date-input';
import {
  balanceCardStyles,
  balanceEmphasisStyles,
  balanceValueStyles,
  fieldsStyles,
  sectionStyles,
} from './payments-tab.styles';

type PaymentResult = z.infer<typeof paymentResultSchema>;

interface PaymentFormValues {
  totalEstimatedAmount: number;
  advanceRequired: number;
  advancePaid: number;
  advancePaidDate: string;
  paymentMode: string;
}

const toFormValues = (payment: PaymentResult): PaymentFormValues => ({
  totalEstimatedAmount: payment.totalEstimatedAmount,
  advanceRequired: payment.advanceRequired,
  advancePaid: payment.advancePaid,
  advancePaidDate: toDateInputValue(payment.advancePaidDate),
  paymentMode: payment.paymentMode ?? '',
});

interface PaymentsTabProps {
  eventId: string;
  // Required, not the Event's own `.optional()` field (STORY-052) — this
  // tab is only ever mounted from event-detail-page.tsx's own
  // `canSeePayments && event.payment &&` gate, which has already narrowed
  // it to present; same reasoning TotalCostSummaryPanel's own `extras`
  // prop documents.
  payment: PaymentResult;
  onEventChanged: () => void;
}

// No canEdit prop, unlike Overview/Rooms — this whole tab is only ever
// rendered for an Event Manager (EventDetailPage doesn't even mount it for
// anyone else), so there's no read-only fallback branch to build here.
const PaymentsTab = ({ eventId, payment, onEventChanged }: PaymentsTabProps) => {
  const [saveError, setSaveError] = useState<string | null>(null);
  // Drives the read-only balance display — updated directly from the
  // mutation's own response so it refreshes the instant a save succeeds,
  // not only once the parent's own refetch (onEventChanged) resolves. Same
  // approach RoomsTab (STORY-020) already uses for its own totals.
  const [savedPayment, setSavedPayment] = useState<PaymentResult>(payment);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<PaymentFormValues>({
    defaultValues: toFormValues(payment),
  });

  const updatePaymentMutation = tsr.updateEventPayment.useMutation({
    onSuccess: (response) => {
      setSaveError(null);
      setSavedPayment(response.body);
      reset(toFormValues(response.body));
      onEventChanged();
    },
    // updateEventPayment only declares a 404 response (matching the backend
    // contract exactly) — a schema-validation 400 (e.g. a negative amount
    // slipping past a number input's own min={0}) isn't a declared member
    // of this route's error union, so there's no narrower message to
    // surface here; the fallback covers it honestly. Same reasoning
    // RoomsTab (STORY-020) already documents for its own accommodation save.
    onError: () => {
      setSaveError('Something went wrong. Please try again.');
    },
  });

  const handleSave = handleSubmit((values) => {
    if (updatePaymentMutation.isPending) {
      return;
    }
    setSaveError(null);
    updatePaymentMutation.mutate({
      params: { id: eventId },
      // An empty date/payment-mode field sends undefined (no change), not
      // a request to clear it — STORY-022's PATCH has no clearing
      // capability, same convention as the Rooms tab's dates.
      body: {
        totalEstimatedAmount: values.totalEstimatedAmount,
        advanceRequired: values.advanceRequired,
        advancePaid: values.advancePaid,
        advancePaidDate: values.advancePaidDate || undefined,
        paymentMode: values.paymentMode || undefined,
      },
    });
  });

  const balanceStyles = savedPayment.balance === 0 ? balanceValueStyles : balanceEmphasisStyles;

  return (
    <Stack sx={sectionStyles}>
      <Stack direction="row" sx={fieldsStyles}>
        <TextField
          {...register('totalEstimatedAmount', { valueAsNumber: true })}
          label="Total estimated amount"
          type="number"
          slotProps={{ htmlInput: { min: 0 } }}
        />
        <TextField
          {...register('advanceRequired', { valueAsNumber: true })}
          label="Advance required"
          type="number"
          slotProps={{ htmlInput: { min: 0 } }}
        />
        <TextField
          {...register('advancePaid', { valueAsNumber: true })}
          label="Advance paid"
          type="number"
          slotProps={{ htmlInput: { min: 0 } }}
        />
        <Controller
          name="advancePaidDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Advance paid date"
              value={toPickerDate(field.value)}
              onChange={(date) => field.onChange(fromPickerDate(date))}
              // A cleared picker shows its own placeholder text, never an
              // invalid/NaN date (this story's own edge case) — fromPickerDate
              // already resolves a cleared/invalid selection to '', so the
              // underlying form value is never anything else.
              slotProps={{ textField: { onBlur: field.onBlur } }}
            />
          )}
        />
        <TextField {...register('paymentMode')} label="Payment mode" />
      </Stack>
      {saveError && (
        <Alert severity="error">
          <Typography variant="bodyM">{saveError}</Typography>
        </Alert>
      )}
      <Paper sx={balanceCardStyles}>
        <Typography variant="titleM" component="h2">
          Balance
        </Typography>
        <Typography variant="titleM" sx={balanceStyles}>
          {savedPayment.balance}
        </Typography>
      </Paper>
      <Button variant="contained" onClick={handleSave} disabled={!isDirty || updatePaymentMutation.isPending}>
        Save payment
      </Button>
    </Stack>
  );
};

export default PaymentsTab;
