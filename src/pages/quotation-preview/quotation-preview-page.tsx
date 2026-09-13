import type { ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Box, CircularProgress, Link, Stack, Typography } from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import { Role, SessionStatus, type eventResultSchema } from '../../contract';
import GenerateQuotationPdfButton from '../event-detail/generate-quotation-pdf-button';
import { toDateInputValue } from '../event-detail/date-input';
import TotalCostSummaryPanel from '../event-detail/total-cost-summary-panel';
import { EVENT_LIST_PATH } from '../../routes';
import { useAuth } from '../../stores/auth-context';
import { headerStyles, numericLineStyles, pageStyles, sectionStyles } from './quotation-preview-page.styles';

type PublicSession = z.infer<typeof eventResultSchema>['sessions'][number];

// A Cancelled Session is excluded here, matching aaradhya-api's own
// STORY-043 PDF renderer exactly — its cost isn't counted in the Total
// Cost Summary (STORY-041's own filter), so showing it as a real scheduled
// item on this "mirrors the same data" preview would diverge from what the
// PDF (and the Grand Total below it) actually reflects.
const isActiveSession = (session: PublicSession): boolean => session.sessionStatus === SessionStatus.Active;

const QuotationPreviewPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  // Sharing the PDF is Event-Manager-only on the backend (STORY-043) — the
  // action would just 403 for anyone else. The rest of this screen mirrors
  // data every role can already see via the Overview/Rooms/Sessions tabs
  // and GET /events/:id/quotation-summary itself, so only this one action
  // is gated, not the whole page.
  const canShare = user?.role === Role.EventManager;

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
    const activeSessions = event.sessions.filter(isActiveSession);
    const dateRange =
      activeSessions.length === 0
        ? null
        : {
            start: activeSessions.reduce(
              (earliest, session) => (session.startDate < earliest ? session.startDate : earliest),
              activeSessions[0]!.startDate,
            ),
            end: activeSessions.reduce(
              (latest, session) => (session.endDate > latest ? session.endDate : latest),
              activeSessions[0]!.endDate,
            ),
          };

    content = (
      <>
        <Box sx={headerStyles}>
          {/* type-display (Fraunces), per this story's own Tokens line —
              one of the few places the theme's own rule says the app is
              "speaking as Aaradhya". */}
          <Typography variant="display" component="h1">
            Aaradhya
          </Typography>
          <Typography variant="titleM" component="h2">
            {event.eventFamilyType} — {event.eventId}
          </Typography>
          <Typography variant="bodyM">
            {dateRange
              ? `${toDateInputValue(dateRange.start)} to ${toDateInputValue(dateRange.end)}`
              : 'No Sessions scheduled yet.'}
          </Typography>
        </Box>

        <Stack sx={sectionStyles}>
          <Typography variant="titleM" component="h2">
            Client Details
          </Typography>
          {event.clientContacts.map((contact, index) => (
            <Typography key={index} variant="bodyM">
              {contact.name} — {contact.contactNumber} ({contact.role})
            </Typography>
          ))}
        </Stack>

        <Stack sx={sectionStyles}>
          <Typography variant="titleM" component="h2">
            Sessions
          </Typography>
          {activeSessions.length === 0 ? (
            <Typography variant="bodyM">No Sessions yet.</Typography>
          ) : (
            activeSessions.map((session) => (
              <Stack key={session.id}>
                <Typography variant="bodyL">
                  {session.sessionType} — {session.venue}
                </Typography>
                <Typography variant="bodyM" sx={numericLineStyles}>
                  {toDateInputValue(session.startDate)} to {toDateInputValue(session.endDate)} · {session.pax} pax ·
                  venue cost {session.venueCost}
                </Typography>
              </Stack>
            ))
          )}
        </Stack>

        <Stack sx={sectionStyles}>
          <Typography variant="titleM" component="h2">
            Accommodation
          </Typography>
          {/* "None" for no Accommodation entered at all (this story's own
              edge case) — RoomsTab's own read-only view has no such
              explicit message, so this isn't reused verbatim from there. */}
          {event.accommodation.roomLines.length === 0 ? (
            <Typography variant="bodyM">None</Typography>
          ) : (
            <>
              <Typography variant="bodyM">
                Check-in: {toDateInputValue(event.accommodation.checkIn) || '—'} · Check-out:{' '}
                {toDateInputValue(event.accommodation.checkOut) || '—'}
              </Typography>
              {event.accommodation.roomLines.map((line, index) => (
                <Typography key={index} variant="bodyM" sx={numericLineStyles}>
                  {line.roomType}: {line.occupancy} occupancy × {line.noOfRooms} rooms — {line.totalInclGst}
                </Typography>
              ))}
            </>
          )}
        </Stack>

        {/* Read-only here (canEdit={false}) — this is a preview to
            sanity-check numbers before sharing, not another place to edit
            extras; that already exists on the Overview tab. */}
        <TotalCostSummaryPanel event={event} canEdit={false} onEventChanged={() => eventQuery.refetch()} />

        {canShare && <GenerateQuotationPdfButton event={event} label="Share PDF" />}
      </>
    );
  }

  return <Box sx={pageStyles}>{content}</Box>;
};

export default QuotationPreviewPage;
