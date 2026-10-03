import { type ReactNode, useState } from 'react';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import { tsr } from '../../api/client';
import LineItemsEditor, {
  type LineItem,
  type LineItemChange,
} from '../../components/ui/line-items-editor/line-items-editor';
import { useToast } from '../../components/ui/toast-provider';
import { formatAmount } from './format-amount';
import {
  grandTotalTileStyles,
  grandTotalValueStyles,
  lineItemsStyles,
  lineItemStyles,
  lineLabelStyles,
  lineValueStyles,
  panelStyles,
} from './total-cost-summary-panel.styles';

const SAVE_ERROR = 'Something went wrong. Please try again.';

// UI Redesign 5C.3.
const CHANGE_TOASTS: Record<LineItemChange, string> = {
  added: 'Line item added.',
  saved: 'Line item saved.',
  removed: 'Line item removed.',
};

interface CostLineProps {
  label: string;
  value: string;
}

const CostLine = ({ label, value }: CostLineProps) => (
  <Box sx={lineItemStyles}>
    <Typography variant="bodyM" component="dt" sx={lineLabelStyles}>
      {label}
    </Typography>
    <Typography variant="numeric" component="dd" sx={lineValueStyles}>
      {value}
    </Typography>
  </Box>
);

// The PUT body's note is optional but never null (aaradhya-api's
// manualLineItemFieldsSchema), so a row without one leaves it out.
const toLineItemBody = ({ name, note, amount }: LineItem) => {
  if (note) {
    return { name, note, amount };
  }
  return { name, amount };
};

interface TotalCostSummaryPanelProps {
  eventId: string;
  // The Event's extra line items — since v2.2.0 (DEV-20, V1) the only
  // extras. Required: both call sites mount the panel only once the
  // role-filtered `event.extraLineItems` is present (Event Manager only).
  extraLineItems: LineItem[];
  // Only an Event Manager gets the Line items editor — the PUT is
  // EventManager-only on the backend. Read-only (the Quotation Preview)
  // shows the rows without actions.
  canEdit: boolean;
  onEventChanged: () => void;
}

const TotalCostSummaryPanel = ({ eventId, extraLineItems, canEdit, onEventChanged }: TotalCostSummaryPanelProps) => {
  const { showSuccess, showError } = useToast();
  // Starts from the loaded Event and follows each PUT's response, so a row
  // shows as soon as it is saved rather than after the Event refetch.
  const [items, setItems] = useState(extraLineItems);

  // Owns its own live rollup query rather than deriving totals client-side
  // — the Grand Total is sourced from a fresh GET /quotation-summary.
  const quotationSummaryQuery = tsr.getQuotationSummary.useQuery({
    queryKey: ['quotation-summary', eventId],
    queryData: { params: { id: eventId } },
    // A failure for a fixed id won't become a success by retrying — same
    // reasoning event-detail-page.tsx's own getEvent query already
    // documents for its 404 case.
    retry: false,
  });

  const updateLineItemsMutation = tsr.updateExtraLineItems.useMutation();

  // Every add / edit / remove sends the whole list (the PUT replaces it),
  // then refreshes the summary and the Event. A failure rejects, so the
  // form keeps what was typed.
  const handleItemsChange = async (nextItems: LineItem[], change: LineItemChange) => {
    try {
      const response = await updateLineItemsMutation.mutateAsync({
        params: { id: eventId },
        body: { extraLineItems: nextItems.map(toLineItemBody) },
      });
      setItems(response.body.extraLineItems);
    } catch (error) {
      showError(SAVE_ERROR);
      throw error;
    }
    quotationSummaryQuery.refetch();
    showSuccess(CHANGE_TOASTS[change]);
    onEventChanged();
  };

  const summary = quotationSummaryQuery.data?.body;

  let totals: ReactNode;
  if (quotationSummaryQuery.isError) {
    totals = <Typography variant="bodyM">{SAVE_ERROR}</Typography>;
  } else if (!summary) {
    totals = <CircularProgress aria-label="Loading Total Cost Summary" />;
  } else {
    totals = (
      <Box component="dl" aria-label="Cost totals" sx={lineItemsStyles}>
        <CostLine label="Venue total" value={formatAmount(summary.venueTotal)} />
        <CostLine label="Food subtotal" value={formatAmount(summary.foodSubtotal)} />
        <CostLine label="Food total (incl. GST)" value={formatAmount(summary.foodTotalInclGst)} />
        <CostLine label="Accommodation total" value={formatAmount(summary.accommodationTotal)} />
        <CostLine label="Extras total" value={formatAmount(summary.extrasTotal)} />
      </Box>
    );
  }

  return (
    <Paper elevation={0} component="section" aria-label="Total Cost Summary" sx={panelStyles}>
      <Typography variant="titleM" component="h2">
        Total Cost Summary
      </Typography>
      {totals}
      <LineItemsEditor items={items} canEdit={canEdit} onItemsChange={handleItemsChange} />
      {summary && (
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
      )}
    </Paper>
  );
};

export default TotalCostSummaryPanel;
