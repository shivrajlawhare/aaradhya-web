import { Box, Link, Paper, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { z } from 'zod';
import type { filteredEventResultSchema } from '../../contract';
import { quotationPreviewPath } from '../../routes';
import GenerateQuotationPdfButton from './generate-quotation-pdf-button';
import { layoutStyles, previewLinkStyles } from './review-tab.styles';
import { tabCardStyles } from './tab-card.styles';
import TotalCostSummaryPanel from './total-cost-summary-panel';

type PublicEvent = z.infer<typeof filteredEventResultSchema>;

interface ReviewTabProps {
  event: PublicEvent;
  // EventManager-only — the panel shows the Grand Total/extras (financial
  // data STORY-046 strips for every other role), and PDF generation/Preview
  // are EventManager-only actions. The page already gates the tab on
  // canEdit; this re-checks, as every tab panel on the page does.
  canEdit: boolean;
  onEventChanged: () => void;
}

// STORY-077/STORY-080 — the Total Cost Summary panel ("Save extras") beside
// a Quotation card holding Generate Quotation PDF and the Preview link
// (Figma UI-25).
const ReviewTab = ({ event, canEdit, onEventChanged }: ReviewTabProps) => {
  if (!canEdit) {
    return null;
  }

  return (
    <Box sx={layoutStyles}>
      {event.extras && (
        <TotalCostSummaryPanel eventId={event.id} extras={event.extras} canEdit onEventChanged={onEventChanged} />
      )}
      <Paper elevation={0} sx={tabCardStyles}>
        <Typography variant="titleM" component="h2">
          Quotation
        </Typography>
        <GenerateQuotationPdfButton event={event} />
        {/* STORY-045's entry point into the Quotation Preview screen. */}
        <Link component={RouterLink} to={quotationPreviewPath(event.id)} variant="labelL" sx={previewLinkStyles}>
          Preview Quotation
        </Link>
      </Paper>
    </Box>
  );
};

export default ReviewTab;
