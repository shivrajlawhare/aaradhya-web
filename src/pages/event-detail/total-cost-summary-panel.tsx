import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import type { extrasResultSchema } from '../../contract';
import { formatAmount } from './format-amount';
import {
  extrasFieldsStyles,
  grandTotalRowStyles,
  grandTotalValueStyles,
  lineItemsStyles,
  lineItemValueStyles,
  panelStyles,
} from './total-cost-summary-panel.styles';

type ExtrasResult = z.infer<typeof extrasResultSchema>;

interface ExtrasFormValues {
  decoration: number;
  photographer: number;
  bhatji: number;
}

const toFormValues = (extras: ExtrasResult): ExtrasFormValues => ({
  decoration: extras.decoration,
  photographer: extras.photographer,
  bhatji: extras.bhatji,
});

interface TotalCostSummaryPanelProps {
  eventId: string;
  // Required, not `PublicEvent['extras']` (`.optional()` since STORY-052) —
  // this panel is only ever mounted from a call site that has already
  // narrowed `event.extras` to present (review-tab.tsx's own
  // `canEdit && event.extras &&` gate; quotation-preview-page.tsx's own
  // equivalent), so its own prop type states the real precondition
  // directly rather than re-deriving "optional, but never actually
  // undefined here" from the full Event shape.
  extras: ExtrasResult;
  // Only an Event Manager gets working inputs for Decoration/Photographer/
  // Bhatji — the extras PATCH is EventManager-only on the backend
  // (STORY-040), same reasoning every other canEdit-gated panel on this
  // tab already applies. Every other line on this panel stays read-only
  // regardless of canEdit (this story's own AC).
  canEdit: boolean;
  onEventChanged: () => void;
}

const TotalCostSummaryPanel = ({ eventId, extras, canEdit, onEventChanged }: TotalCostSummaryPanelProps) => {
  const [saveError, setSaveError] = useState<string | null>(null);

  // Owns its own live rollup query rather than deriving totals from
  // event.extras client-side — the Grand Total must be "sourced from a
  // fresh STORY-041 call" (this story's own AC), not recalculated here.
  const quotationSummaryQuery = tsr.getQuotationSummary.useQuery({
    queryKey: ['quotation-summary', eventId],
    queryData: { params: { id: eventId } },
    // A failure for a fixed id won't become a success by retrying — same
    // reasoning event-detail-page.tsx's own getEvent query already
    // documents for its 404 case.
    retry: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<ExtrasFormValues>({
    defaultValues: toFormValues(extras),
  });

  const updateExtrasMutation = tsr.updateEventExtras.useMutation({
    onSuccess: (response) => {
      setSaveError(null);
      reset(toFormValues(response.body));
      // Re-fetches the summary rather than recomputing the Grand Total from
      // this response — the same "sourced from a fresh call" requirement.
      quotationSummaryQuery.refetch();
      onEventChanged();
    },
    // updateEventExtras only declares a 404 response (matching the backend
    // contract exactly) — a schema-validation 400 (e.g. a negative amount
    // slipping past a number input's own min={0}) isn't a declared member
    // of this route's error union, so there's no narrower message to
    // surface here; the fallback covers it honestly. Same reasoning
    // PaymentsTab/RoomsTab already document for their own saves.
    onError: () => {
      setSaveError('Something went wrong. Please try again.');
    },
  });

  const handleSave = handleSubmit((values) => {
    if (updateExtrasMutation.isPending) {
      return;
    }
    setSaveError(null);
    updateExtrasMutation.mutate({ params: { id: eventId }, body: values });
  });

  const summary = quotationSummaryQuery.data?.body;

  return (
    <Paper sx={panelStyles}>
      <Typography variant="titleM" component="h2">
        Total Cost Summary
      </Typography>
      {quotationSummaryQuery.isError ? (
        <Typography variant="bodyM">Something went wrong. Please try again.</Typography>
      ) : !summary ? (
        <CircularProgress aria-label="Loading Total Cost Summary" />
      ) : (
        <>
          <Stack sx={lineItemsStyles}>
            <Typography variant="bodyM" sx={lineItemValueStyles}>
              Venue total: {formatAmount(summary.venueTotal)}
            </Typography>
            <Typography variant="bodyM" sx={lineItemValueStyles}>
              Food subtotal: {formatAmount(summary.foodSubtotal)}
            </Typography>
            <Typography variant="bodyM" sx={lineItemValueStyles}>
              Food total (incl. GST): {formatAmount(summary.foodTotalInclGst)}
            </Typography>
            <Typography variant="bodyM" sx={lineItemValueStyles}>
              Accommodation total: {formatAmount(summary.accommodationTotal)}
            </Typography>
            <Typography variant="bodyM" sx={lineItemValueStyles}>
              Extras total: {formatAmount(summary.extrasTotal)}
            </Typography>
          </Stack>
          {canEdit ? (
            <Stack direction="row" sx={extrasFieldsStyles}>
              <TextField
                {...register('decoration', { valueAsNumber: true })}
                label="Decoration"
                type="number"
                slotProps={{ htmlInput: { min: 0 } }}
              />
              <TextField
                {...register('photographer', { valueAsNumber: true })}
                label="Photographer"
                type="number"
                slotProps={{ htmlInput: { min: 0 } }}
              />
              <TextField
                {...register('bhatji', { valueAsNumber: true })}
                label="Bhatji"
                type="number"
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Stack>
          ) : (
            <Stack sx={lineItemsStyles}>
              <Typography variant="bodyM" sx={lineItemValueStyles}>
                Decoration: {formatAmount(extras.decoration)}
              </Typography>
              <Typography variant="bodyM" sx={lineItemValueStyles}>
                Photographer: {formatAmount(extras.photographer)}
              </Typography>
              <Typography variant="bodyM" sx={lineItemValueStyles}>
                Bhatji: {formatAmount(extras.bhatji)}
              </Typography>
            </Stack>
          )}
          {saveError && (
            <Alert severity="error">
              <Typography variant="bodyM">{saveError}</Typography>
            </Alert>
          )}
          {canEdit && (
            <Button variant="contained" onClick={handleSave} disabled={!isDirty || updateExtrasMutation.isPending}>
              Save extras
            </Button>
          )}
          <Stack sx={grandTotalRowStyles}>
            <Typography variant="bodyM" component="span">
              Grand Total
            </Typography>
            <Typography variant="display" component="span" sx={grandTotalValueStyles}>
              {/* Rounded to the nearest whole rupee — a fractional
                  foodTotalInclGst (e.g. 597150 × 1.05 = 627007.5) otherwise
                  shows through verbatim as "10,73,207.5", the same rounding
                  gap STORY-072's own formatQuotationRupees fix already
                  closed for the Quotation's own printed Grand Total.
                  formatAmount itself stays untouched — it's a shared,
                  general-purpose formatter (Payments, extras, Room costs)
                  where a caller that genuinely needs fractional precision
                  shouldn't lose it. */}
              {formatAmount(Math.round(summary.grandTotal))}
            </Typography>
          </Stack>
        </>
      )}
    </Paper>
  );
};

export default TotalCostSummaryPanel;
