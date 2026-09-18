import type { ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Box, CircularProgress, Link, Typography } from '@mui/material';
import { tsr } from '../../api/client';
import GenerateQuotationPdfButton from '../event-detail/generate-quotation-pdf-button';
import TotalCostSummaryPanel from '../event-detail/total-cost-summary-panel';
import { EVENT_LIST_PATH } from '../../routes';
import QuotationDocument from './quotation-document';
import { pageStyles } from './quotation-preview-page.styles';

const QuotationPreviewPage = () => {
  const { id } = useParams();
  // The whole route is now RequireRole([EventManager])-gated (STORY-052,
  // app.tsx) — this screen shows the exact same full financial breakdown
  // (Grand Total, extras, accommodation/session costs) STORY-052 scoped
  // to Event Manager only everywhere else on Event Detail (Overview's own
  // Total Cost Summary panel, the Payments tab). The original reasoning
  // for leaving this route open ("every field this screen shows is already
  // visible to any authenticated caller via the Overview/Rooms/Sessions
  // tabs") stopped being true once those tabs became role-filtered —
  // leaving this screen open would have been a direct bypass of the very
  // gating STORY-052 exists to add. `canShare` is gone too: RequireRole
  // already guarantees every session reaching this component is an Event
  // Manager, so the "Share PDF" button's own visibility no longer needs a
  // second, separate role check.
  const eventQuery = tsr.getEvent.useQuery({
    queryKey: ['event', id ?? ''],
    queryData: { params: { id: id ?? '' } },
    enabled: Boolean(id),
    retry: false,
  });

  let content: ReactNode;
  if (!id || eventQuery.isPending) {
    content = <CircularProgress aria-label="Loading event" />;
  } else if (eventQuery.isError) {
    const error = eventQuery.error;
    const message =
      !(error instanceof Error) && error.status === 404
        ? 'No Event with that id.'
        : 'Something went wrong. Please try again.';
    content = (
      <Box>
        <Typography variant="bodyM">{message}</Typography>
        <Typography variant="bodyM">
          <Link component={RouterLink} to={EVENT_LIST_PATH}>
            Back to Events
          </Link>
        </Typography>
      </Box>
    );
  } else {
    const event = eventQuery.data.body;

    content = (
      <>
        {/* One shared render tree for both this on-screen preview and the
            eventual server-side Playwright PDF render (STORY-069's own UI
            line, Aaradhya_Quotation_PDF_Strategy.md §4) — `?? []` matches
            this page's own pre-existing defensive posture elsewhere
            (Sessions' venue cost) for a field that's `.optional()` on
            filteredEventResultSchema (STORY-052) even though RequireRole
            already guarantees an Event Manager here. */}
        <QuotationDocument
          clientContacts={event.clientContacts ?? []}
          sessions={event.sessions}
          accommodation={event.accommodation}
        />

        {/* Read-only here (canEdit={false}) — this is a preview to
            sanity-check numbers before sharing, not another place to edit
            extras; that already exists on the Overview tab. `event.extras &&`
            satisfies the field's own `.optional()` type (STORY-052) —
            RequireRole already guarantees it's actually present here. */}
        {event.extras && (
          <TotalCostSummaryPanel
            eventId={event.id}
            extras={event.extras}
            canEdit={false}
            onEventChanged={() => eventQuery.refetch()}
          />
        )}

        <GenerateQuotationPdfButton event={event} label="Share PDF" />
      </>
    );
  }

  return <Box sx={pageStyles}>{content}</Box>;
};

export default QuotationPreviewPage;
