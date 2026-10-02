import { type ReactNode, useState } from 'react';
import { Alert, Box, Button, CircularProgress, InputAdornment, Paper, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import { useToast } from '../../components/ui/toast-provider';
import type { extrasResultSchema } from '../../contract';
import { formatAmount } from './format-amount';
import {
  extrasLabelStyles,
  extrasStyles,
  grandTotalTileStyles,
  grandTotalValueStyles,
  lineItemsStyles,
  lineItemStyles,
  lineLabelStyles,
  lineValueStyles,
  panelStyles,
  saveButtonStyles,
} from './total-cost-summary-panel.styles';

type ExtrasResult = z.infer<typeof extrasResultSchema>;

interface ExtrasFormValues {
  decoration: number;
  photographer: number;
  bhatji: number;
}

const EXTRA_FIELDS: { name: keyof ExtrasFormValues; label: string }[] = [
  { name: 'decoration', label: 'Decoration' },
  { name: 'photographer', label: 'Photographer' },
  { name: 'bhatji', label: 'Bhatji' },
];

const RUPEE_ADORNMENT = { input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } };

interface LineItemProps {
  label: string;
  value: string;
}

const LineItem = ({ label, value }: LineItemProps) => (
  <Box sx={lineItemStyles}>
    <Typography variant="bodyM" component="dt" sx={lineLabelStyles}>
      {label}
    </Typography>
    <Typography variant="numeric" component="dd" sx={lineValueStyles}>
      {value}
    </Typography>
  </Box>
);

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
  const { showSuccess, showError } = useToast();
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
      showSuccess('Extras saved.');
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
      showError('Something went wrong. Please try again.');
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

  let extrasContent: ReactNode;
  if (canEdit) {
    extrasContent = (
      <>
        {EXTRA_FIELDS.map(({ name, label }) => (
          <TextField
            key={name}
            {...register(name, { valueAsNumber: true })}
            label={label}
            type="number"
            fullWidth
            slotProps={{ htmlInput: { min: 0 }, ...RUPEE_ADORNMENT }}
          />
        ))}
      </>
    );
  } else {
    extrasContent = (
      <Box component="dl" sx={lineItemsStyles}>
        {EXTRA_FIELDS.map(({ name, label }) => (
          <LineItem key={name} label={label} value={formatAmount(extras[name])} />
        ))}
      </Box>
    );
  }

  let body: ReactNode;
  if (quotationSummaryQuery.isError) {
    body = <Typography variant="bodyM">Something went wrong. Please try again.</Typography>;
  } else if (!summary) {
    body = <CircularProgress aria-label="Loading Total Cost Summary" />;
  } else {
    body = (
      <>
        <Box component="dl" aria-label="Cost totals" sx={lineItemsStyles}>
          <LineItem label="Venue total" value={formatAmount(summary.venueTotal)} />
          <LineItem label="Food subtotal" value={formatAmount(summary.foodSubtotal)} />
          <LineItem label="Food total (incl. GST)" value={formatAmount(summary.foodTotalInclGst)} />
          <LineItem label="Accommodation total" value={formatAmount(summary.accommodationTotal)} />
          <LineItem label="Extras total" value={formatAmount(summary.extrasTotal)} />
        </Box>
        <Box sx={extrasStyles}>
          <Typography variant="labelS" component="h3" sx={extrasLabelStyles}>
            Extras
          </Typography>
          {extrasContent}
          {saveError && (
            <Alert severity="error">
              <Typography variant="bodyM">{saveError}</Typography>
            </Alert>
          )}
          {canEdit && (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!isDirty || updateExtrasMutation.isPending}
              sx={saveButtonStyles}
            >
              Save extras
            </Button>
          )}
        </Box>
        <Box sx={grandTotalTileStyles}>
          <Typography variant="labelS" component="p">
            Grand Total
          </Typography>
          {/* Rounded to the whole rupee — a fractional foodTotalInclGst
              (597150 × 1.05 = 627007.5) would otherwise show through as
              "10,73,207.5"; formatAmount itself stays general-purpose. */}
          <Typography variant="display" component="p" sx={grandTotalValueStyles}>
            {formatAmount(Math.round(summary.grandTotal))}
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <Paper elevation={0} component="section" aria-label="Total Cost Summary" sx={panelStyles}>
      <Typography variant="titleM" component="h2">
        Total Cost Summary
      </Typography>
      {body}
    </Paper>
  );
};

export default TotalCostSummaryPanel;
