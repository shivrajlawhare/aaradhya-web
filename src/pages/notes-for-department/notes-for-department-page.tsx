import type { ReactNode } from 'react';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import PinchOutlinedIcon from '@mui/icons-material/PinchOutlined';
import { Alert, Box, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useParams, useSearchParams } from 'react-router-dom';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import DocumentToolbar, { type DocumentToolbarAction } from '../../components/ui/document-toolbar';
import EmptyState from '../../components/ui/empty-state';
import ErrorState from '../../components/ui/error-state';
import type { IllustrationName } from '../../components/ui/illustrations';
import PageLoader from '../../components/ui/page-loader';
import type { banquetEventOrderResultSchema } from '../../contract';
import { EVENT_LIST_PATH } from '../../routes';
import {
  pageStyles,
  paperStyles,
  pinchHintStyles,
  printPageStyles,
  stateStyles,
} from '../quotation-preview/quotation-preview-page.styles';
import ScaledPaper from '../quotation-preview/scaled-paper';
import BanquetEventOrderDocument from './banquet-event-order-document';
import { canvasStyles } from './notes-for-department-page.styles';
import { useBanquetEventOrderPdfDownload } from './use-banquet-event-order-pdf-download';

type BanquetEventOrder = z.infer<typeof banquetEventOrderResultSchema>;

const NOT_FOUND_MESSAGE = 'No Event with that id.';
const LOAD_ERROR_MESSAGE = 'Something went wrong. Please try again.';

interface BeoViewProps {
  order: BanquetEventOrder;
  isPrintMode: boolean;
  isDesktop: boolean;
  downloadError: string | null;
}

// The loaded order: the pages, plus (outside print mode) the canvas around
// them — a "Pinch to zoom" scaled sheet on mobile.
const BeoView = ({ order, isPrintMode, isDesktop, downloadError }: BeoViewProps) => {
  if (order.sessions.length === 0) {
    return (
      <Box sx={stateStyles}>
        <EmptyState illustration="no-sessions" title="No active sessions to print." />
      </Box>
    );
  }

  const pages = <BanquetEventOrderDocument clientName={order.clientName} sessions={order.sessions} />;

  if (isPrintMode) {
    return pages;
  }

  const errorAlert = downloadError && (
    <Alert severity="error">
      <Typography variant="bodyM">{downloadError}</Typography>
    </Alert>
  );

  if (!isDesktop) {
    return (
      <Box sx={canvasStyles}>
        <Box sx={pinchHintStyles}>
          <PinchOutlinedIcon fontSize="small" aria-hidden />
          <Typography variant="labelM">Pinch to zoom</Typography>
        </Box>
        {errorAlert}
        <ScaledPaper>{pages}</ScaledPaper>
      </Box>
    );
  }

  return (
    <Box sx={canvasStyles}>
      {errorAlert}
      <Box sx={paperStyles}>{pages}</Box>
    </Box>
  );
};

// Notes for Department (CR-1 D4/D5, UI-44): the Banquet Event Order — one
// page per active session — for every role, with "Download PDF". `?print=1`
// is what aaradhya-api's browser-pdf.ts renders: just the pages.
const NotesForDepartmentPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isPrintMode = searchParams.get('print') === '1';
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const orderQuery = tsr.getBanquetEventOrder.useQuery({
    queryKey: ['banquet-event-order', id ?? ''],
    queryData: { params: { id: id ?? '' } },
    enabled: Boolean(id),
    retry: false,
  });

  const order = orderQuery.data?.body;
  const pdf = useBanquetEventOrderPdfDownload({ id: order?.id ?? id ?? '', eventId: order?.eventId ?? '' });

  let content: ReactNode;
  if (!id || orderQuery.isPending) {
    content = (
      <Box sx={stateStyles}>
        <PageLoader caption="Loading Notes for Department" />
      </Box>
    );
  } else if (orderQuery.isError || !order) {
    const error = orderQuery.error;
    const isNotFound = orderQuery.isError && !(error instanceof Error) && error?.status === 404;
    let illustration: IllustrationName = 'something-went-wrong';
    let message = LOAD_ERROR_MESSAGE;
    if (isNotFound) {
      illustration = 'not-found';
      message = NOT_FOUND_MESSAGE;
    }
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
    content = <BeoView order={order} isPrintMode={isPrintMode} isDesktop={isDesktop} downloadError={pdf.error} />;
  }

  if (isPrintMode) {
    return <Box sx={printPageStyles}>{content}</Box>;
  }

  const downloadAction: DocumentToolbarAction = {
    label: 'Download PDF',
    icon: <DownloadRoundedIcon />,
    isLoading: pdf.isFetching,
    onClick: pdf.download,
  };

  return (
    <Box sx={pageStyles}>
      <DocumentToolbar
        event={order}
        title="Banquet Event Order"
        mobileTitle="Banquet Event Order"
        action={downloadAction}
        isMobileMarkHidden
        isDesktop={isDesktop}
      />
      {content}
    </Box>
  );
};

export default NotesForDepartmentPage;
