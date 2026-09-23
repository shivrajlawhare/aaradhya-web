import { Link, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { z } from 'zod';
import type { filteredEventResultSchema } from '../../contract';
import { quotationPreviewPath } from '../../routes';
import GenerateQuotationPdfButton from './generate-quotation-pdf-button';
import { sectionStyles } from './review-tab.styles';
import TotalCostSummaryPanel from './total-cost-summary-panel';

type PublicEvent = z.infer<typeof filteredEventResultSchema>;

interface ReviewTabProps {
  event: PublicEvent;
  // EventManager-only, same reasoning the old OverviewTab already documented
  // for this exact content — the Total Cost Summary shows Grand Total/extras
  // (the same class of financial data STORY-046 strips end-to-end for every
  // other role), and PDF generation/Preview are themselves EventManager-only
  // actions. event-detail-page.tsx's own Tab for 'review' is already gated
  // on canEdit, so this component never mounts for anyone else — but it
  // still re-checks below, same "defense in depth" every other tab panel on
  // this page already applies.
  canEdit: boolean;
  onEventChanged: () => void;
}

// STORY-077/STORY-080 — extracted verbatim from the old OverviewTab: this is
// the other half of that split (client-details-tab.tsx has Status/Client
// Contacts), reachable from STORY-076's own "Review & Quotation" tab slot.
// No behavior change from what OverviewTab already did for this content.
const ReviewTab = ({ event, canEdit, onEventChanged }: ReviewTabProps) => (
  <Stack sx={sectionStyles}>
    {/* STORY-052's own re-check: this panel shows Grand Total/extras — the
        same class of financial data STORY-046 already strips end-to-end
        for every non-EventManager role (`extras` is undefined for them). */}
    {canEdit && event.extras && (
      <TotalCostSummaryPanel
        eventId={event.id}
        extras={event.extras}
        canEdit={canEdit}
        onEventChanged={onEventChanged}
      />
    )}
    {canEdit && <GenerateQuotationPdfButton event={event} />}
    {/* STORY-045's entry point into the Quotation Preview screen. */}
    {canEdit && (
      <Link component={RouterLink} to={quotationPreviewPath(event.id)}>
        Preview Quotation
      </Link>
    )}
  </Stack>
);

export default ReviewTab;
