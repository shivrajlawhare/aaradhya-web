import type { ReactNode } from 'react';
import PinchOutlinedIcon from '@mui/icons-material/PinchOutlined';
import { Alert, Box, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useParams, useSearchParams } from 'react-router-dom';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import ErrorState from '../../components/ui/error-state';
import PageLoader from '../../components/ui/page-loader';
import type { filteredEventResultSchema } from '../../contract';
import { EVENT_LIST_PATH } from '../../routes';
import TotalCostSummaryPanel from '../event-detail/total-cost-summary-panel';
import { useQuotationPdfDownload } from '../event-detail/use-quotation-pdf-download';
import QuotationDocument from './quotation-document';
import {
  canvasStyles,
  pageStyles,
  paperStyles,
  pinchHintStyles,
  printPageStyles,
  sideColumnStyles,
  stateStyles,
} from './quotation-preview-page.styles';
import QuotationToolbar from './quotation-toolbar';
import ScaledPaper from './scaled-paper';

type PublicEvent = z.infer<typeof filteredEventResultSchema>;

interface QuotationViewProps {
  event: PublicEvent;
  menuItemsById: Map<string, string>;
  isPrintMode: boolean;
  isDesktop: boolean;
  shareError: string | null;
  onEventChanged: () => void;
}

// The loaded Quotation: the document, plus (outside print mode) the canvas
// around it and the read-only cost panel.
const QuotationView = ({
  event,
  menuItemsById,
  isPrintMode,
  isDesktop,
  shareError,
  onEventChanged,
}: QuotationViewProps) => {
  // Resolves each Item's menu-item ids to names (no populate convention
  // exists), so QuotationDocument stays a pure render tree.
  const sessionsForQuotation = event.sessions.map((session) => ({
    ...session,
    items: (session.items ?? []).map((item) => ({
      ...item,
      menuItemNames: item.menuItems.map((menuItemId) => menuItemsById.get(menuItemId) ?? menuItemId),
    })),
  }));

  // One render tree for this preview and the server-side PDF (?print=1).
  const quotationDocument = (
    <QuotationDocument
      clientContacts={event.clientContacts ?? []}
      sessions={sessionsForQuotation}
      accommodation={event.accommodation}
      extraLineItems={event.extraLineItems ?? []}
      foodGstRatePercent={event.foodGstRatePercent}
    />
  );

  if (isPrintMode) {
    return quotationDocument;
  }

  const errorAlert = shareError && (
    <Alert severity="error">
      <Typography variant="bodyM">{shareError}</Typography>
    </Alert>
  );

  // Read-only: a place to sanity-check numbers before sharing, not to edit
  // extras (the Overview tab does that).
  const panel = event.extras && (
    <TotalCostSummaryPanel eventId={event.id} extras={event.extras} canEdit={false} onEventChanged={onEventChanged} />
  );

  if (!isDesktop) {
    return (
      <Box sx={canvasStyles}>
        <Box sx={pinchHintStyles}>
          <PinchOutlinedIcon fontSize="small" aria-hidden />
          <Typography variant="labelM">Pinch to zoom</Typography>
        </Box>
        {errorAlert}
        <ScaledPaper>{quotationDocument}</ScaledPaper>
        {panel}
      </Box>
    );
  }

  return (
    <Box sx={canvasStyles}>
      <Box sx={paperStyles}>{quotationDocument}</Box>
      <Box sx={sideColumnStyles}>
        {errorAlert}
        {panel}
      </Box>
    </Box>
  );
};

// The Quotation Preview (STORY-045; DEV-09 toolbar, D9/D10). `?print=1` is
// the URL aaradhya-api's browser-pdf.ts drives a headless browser to, so the
// PDF is this same document with nothing else around it.
const QuotationPreviewPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isPrintMode = searchParams.get('print') === '1';
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // The route is RequireRole([EventManager])-gated (STORY-052): this screen
  // shows the full financial breakdown.
  const eventQuery = tsr.getEvent.useQuery({
    queryKey: ['event', id ?? ''],
    queryData: { params: { id: id ?? '' } },
    enabled: Boolean(id),
    retry: false,
  });

  // The Menu Item master, to resolve each Meal Item's menu-item ids.
  const menuItemsQuery = tsr.listMenuItems.useQuery({
    queryKey: ['menu-items'],
    queryData: { query: {} },
  });

  const event = eventQuery.data?.body;
  const pdf = useQuotationPdfDownload({ id: event?.id ?? id ?? '', eventId: event?.eventId ?? '' });

  let content: ReactNode;
  if (!id || eventQuery.isPending || menuItemsQuery.isPending) {
    content = (
      <Box sx={stateStyles}>
        <PageLoader caption="Loading event" />
      </Box>
    );
  } else if (eventQuery.isError || menuItemsQuery.isError || !event) {
    // A failed menu-item lookup would otherwise print raw ids in every Menu
    // column with no sign anything went wrong.
    const error = eventQuery.error;
    const isNotFound = eventQuery.isError && !(error instanceof Error) && error?.status === 404;
    const illustration = isNotFound ? 'not-found' : 'something-went-wrong';
    const message = isNotFound ? 'No Event with that id.' : 'Something went wrong. Please try again.';
    content = (
      <Box sx={stateStyles}>
        <ErrorState
          illustration={illustration}
          message={message}
          link={{ label: 'Back to Events', to: EVENT_LIST_PATH }}
        />
      </Box>
    );
  } else {
    const menuItemsById = new Map((menuItemsQuery.data?.body ?? []).map((menuItem) => [menuItem.id, menuItem.name]));
    content = (
      <QuotationView
        event={event}
        menuItemsById={menuItemsById}
        isPrintMode={isPrintMode}
        isDesktop={isDesktop}
        shareError={pdf.error}
        onEventChanged={() => eventQuery.refetch()}
      />
    );
  }

  if (isPrintMode) {
    return <Box sx={printPageStyles}>{content}</Box>;
  }

  return (
    <Box sx={pageStyles}>
      <QuotationToolbar event={event} isDesktop={isDesktop} isSharing={pdf.isFetching} onShare={pdf.download} />
      {content}
    </Box>
  );
};

export default QuotationPreviewPage;
