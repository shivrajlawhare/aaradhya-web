import type { ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Box, CircularProgress, Link, Stack, Typography } from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import { SessionStatus, type filteredEventResultSchema } from '../../contract';
import GenerateQuotationPdfButton from '../event-detail/generate-quotation-pdf-button';
import { toDateInputValue } from '../event-detail/date-input';
import TotalCostSummaryPanel from '../event-detail/total-cost-summary-panel';
import { EVENT_LIST_PATH } from '../../routes';
import { headerStyles, numericLineStyles, pageStyles, sectionStyles } from './quotation-preview-page.styles';

type PublicSession = z.infer<typeof filteredEventResultSchema>['sessions'][number];

// A Cancelled Session is excluded here, matching aaradhya-api's own
// STORY-043 PDF renderer exactly — its cost isn't counted in the Total
// Cost Summary (STORY-041's own filter), so showing it as a real scheduled
// item on this "mirrors the same data" preview would diverge from what the
// PDF (and the Grand Total below it) actually reflects.
const isActiveSession = (session: PublicSession): boolean => session.sessionStatus === SessionStatus.Active;

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
    const activeSessions = event.sessions.filter(isActiveSession);

    // Extracted to a variable rather than an inline ternary in the JSX
    // below (typescript-rules rule 5) — also handles `accommodation` itself
    // being `undefined` (STORY-052's own `.optional()` field) the same way
    // "no rooms entered" already was, rather than only guarding
    // `.roomLines.length`.
    let accommodationSection: ReactNode;
    if (!event.accommodation || event.accommodation.roomLines.length === 0) {
      // "None" for no Accommodation entered at all (STORY-045's own edge
      // case) — RoomsTab's own read-only view has no such explicit
      // message, so this isn't reused verbatim from there.
      accommodationSection = <Typography variant="bodyM">None</Typography>;
    } else {
      const accommodation = event.accommodation;
      accommodationSection = (
        <>
          <Typography variant="bodyM">
            Check-in: {toDateInputValue(accommodation.checkIn) || '—'} · Check-out:{' '}
            {toDateInputValue(accommodation.checkOut) || '—'}
          </Typography>
          {accommodation.roomLines.map((line, index) => (
            <Typography key={index} variant="bodyM" sx={numericLineStyles}>
              {line.roomType}: {line.occupancy} occupancy × {line.noOfRooms} rooms — {line.totalInclGst ?? '—'}
            </Typography>
          ))}
        </>
      );
    }

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
          {/* `?? []` — RequireRole (app.tsx) already guarantees every
              session reaching this component is an Event Manager, whose
              own clientContacts is always present unfiltered; the fallback
              exists purely to satisfy the field's `.optional()` type
              (STORY-052's filteredEventResultSchema), matching this page's
              own defensive posture elsewhere (Accommodation, Sessions'
              venue cost) rather than trusting the route guard alone. */}
          {(event.clientContacts ?? []).map((contact, index) => (
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
                  venue cost {session.venueCost ?? '—'}
                </Typography>
              </Stack>
            ))
          )}
        </Stack>

        <Stack sx={sectionStyles}>
          <Typography variant="titleM" component="h2">
            Accommodation
          </Typography>
          {accommodationSection}
        </Stack>

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
