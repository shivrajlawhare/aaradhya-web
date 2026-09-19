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

  // STORY-071 — the full Menu Item master list, fetched once here the same
  // way items-section.tsx's own pre-existing menuItemsById lookup already
  // is: a Meal Item's own `menuItems` field is an array of ids only (no
  // populate/expand convention exists anywhere), so this page resolves them
  // to display names itself before handing them to QuotationDocument, which
  // stays a pure, id-lookup-free render tree.
  const menuItemsQuery = tsr.listMenuItems.useQuery({
    queryKey: ['menu-items'],
    queryData: { query: {} },
  });

  let content: ReactNode;
  if (!id || eventQuery.isPending || menuItemsQuery.isPending) {
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
  } else if (menuItemsQuery.isError) {
    // Without this branch, a failed GET /menu-items would silently fall
    // through to the success branch below with an empty menuItemsById map —
    // every Meal Item's Menu column would then print raw Menu Item ObjectId
    // strings instead of names, with no indication anything went wrong.
    content = (
      <Box>
        <Typography variant="bodyM">Something went wrong. Please try again.</Typography>
      </Box>
    );
  } else {
    const event = eventQuery.data.body;
    const menuItemsById = new Map((menuItemsQuery.data?.body ?? []).map((menuItem) => [menuItem.id, menuItem.name]));
    // Resolves each Session's raw `items` (menuItems as ids only) into the
    // shape QuotationDocument actually wants (STORY-071) — `?? []` matches
    // this page's own pre-existing defensive posture for `items` being
    // `.optional()` on filteredSessionResultSchema (STORY-052) even though
    // RequireRole already guarantees an Event Manager here.
    const sessionsForQuotation = event.sessions.map((session) => ({
      ...session,
      items: (session.items ?? []).map((item) => ({
        ...item,
        menuItemNames: item.menuItems.map((menuItemId) => menuItemsById.get(menuItemId) ?? menuItemId),
      })),
    }));

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
          sessions={sessionsForQuotation}
          accommodation={event.accommodation}
          extraLineItems={event.extraLineItems ?? []}
          foodGstRatePercent={event.foodGstRatePercent}
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
