import { type ReactNode, useState } from 'react';
import { Box, Tab, Tabs, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useParams } from 'react-router-dom';
import { tsr } from '../../api/client';
import ActivityTab from '../../components/ui/activity-tab';
import ErrorState from '../../components/ui/error-state';
import type { IllustrationName } from '../../components/ui/illustrations';
import PageLoader from '../../components/ui/page-loader';
import { Role } from '../../contract';
import { EVENT_LIST_PATH, notesForDepartmentPath } from '../../routes';
import { useAuth } from '../../stores/auth-context';
import ClientDetailsTab from './client-details-tab';
import DeleteEventDialog from './delete-event-dialog';
import DocumentsTab from './documents-tab';
import EventDetailHeader from './event-detail-header';
import { pageStyles, tabPanelStyles, tabsStyles } from './event-detail-page.styles';
import { computeEventSummary } from './event-summary';
import PaymentsTab from './payments-tab';
import ReviewTab from './review-tab';
import RoomsTab from './rooms-tab';
import SessionsItemsTab from './sessions-items-tab';
import SessionsTab from './sessions-tab';

// STORY-076 — renamed/reordered to mirror the New Event wizard's own 5 steps
// (Client Details, Event Details, Accommodation, Sessions & Items, Review &
// Quotation), with Payments/Documents/Activity kept as-is per the story's own
// explicit scope. STORY-077 split the old OverviewTab into ClientDetailsTab
// (Status + Client Contacts) and ReviewTab (Total Cost Summary/PDF/Preview
// Quotation); STORY-078 trimmed Items out of the Sessions component behind
// 'event-details'; STORY-079 built the real 'sessions-items' tab.
type DetailTab =
  | 'client-details'
  | 'event-details'
  | 'accommodation'
  | 'sessions-items'
  | 'review'
  | 'payments'
  | 'documents'
  | 'activity';

const EventDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [activeTab, setActiveTab] = useState<DetailTab>('client-details');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const eventQuery = tsr.getEvent.useQuery({
    queryKey: ['event', id ?? ''],
    queryData: { params: { id: id ?? '' } },
    enabled: Boolean(id),
    // A 404 for a fixed id won't become a 200 by retrying — TanStack's
    // default (retry every failure up to 3 times) would just delay the
    // "not found" state by several seconds for no benefit.
    retry: false,
  });

  // Activity is EventManager-only — re-checking STORY-010's flagged item:
  // GET /change-log itself is EventManager-only on the backend, so showing
  // this tab to anyone else would just render a 403, not real log entries.
  // Payments is EventManager-only too, but for a different reason: the SRS
  // states Payment Record visibility as "Event Manager only" outright
  // (§4.4), and separately states Reception explicitly does not see
  // payment data (§3.4) — this story's own AC requires the tab not be in
  // the DOM at all for anyone else, not just visually hidden. Kept as its
  // own named flag (not reused from canSeeActivity) even though both
  // currently evaluate the same way — they're separate business rules that
  // happen to coincide today, not one rule.
  // Documents is EventManager-only for the same "not listed for any other
  // role" reasoning as Payments: the SRS's §3.1 names the Documents
  // Checklist under the Event Manager's full-access scope, but never once
  // under F&B Head/Housekeeping/Reception's own "Sees:" lists (§3.2-3.4).
  // Also its own named flag, not reused from canSeePayments — same
  // "coincide today, not one rule" reasoning.
  //
  // Rooms/Sessions/Setup/Menu (STORY-052) — every role's own SRS §3.x "Sees:"
  // list, restated as this screen's tab-visibility matrix. Tab names below
  // are STORY-076's renamed ones (Accommodation = old Rooms, Event Details =
  // old Sessions' own session-level fields):
  // EventManager: Client Details, Event Details, Sessions & Items,
  //   Accommodation, Review & Quotation, Payments, Documents, Activity —
  //   unchanged (this story's own regression AC).
  // F&B Head (§3.2): Client Details (filtered) + Event Details (Menu
  //   summary line, no Setup) + Sessions & Items (Food/Dining rows only —
  //   see canSeeItems below). No Accommodation — §3.2 never mentions
  //   accommodation/rooms.
  // Housekeeping (§3.3): Client Details (read-only contacts, D17) + Accommodation + Event
  //   Details (Setup summary line, no Menu). NOT Sessions & Items — STORY-
  //   079's own investigation found the backend's filterEventForRole sends
  //   Housekeeping no `items` at all (event-visibility.ts: "Housekeeping and
  //   Reception get no items at all"), so a tab with literally nothing to
  //   show them would be pointless; narrower than STORY-076's original
  //   canSeeSessions-for-everything gate, corrected once this was found.
  // Reception (§3.4): Client Details (filtered) + Accommodation. No Event
  //   Details/Sessions & Items at all — this story's own explicit bullet
  //   ("Payments and Sessions & Menu are absent"), even though §3.4 itself
  //   lists venue/pax/date(s) among what Reception sees; the AC's own
  //   literal tab list wins over re-deriving a looser rule from the
  //   field-visibility table.
  // Written as explicit role-equality checks (not `!== Role.X`) so an
  // unauthenticated `user` (undefined) safely defaults every flag to
  // `false`, matching canSeeActivity/canSeePayments/canSeeDocuments'
  // existing pattern, rather than an inverted check defaulting to `true`.
  const canSeeActivity = user?.role === Role.EventManager;
  const canSeePayments = user?.role === Role.EventManager;
  const canSeeDocuments = user?.role === Role.EventManager;
  const canSeeRooms =
    user?.role === Role.EventManager || user?.role === Role.Housekeeping || user?.role === Role.Reception;
  const canSeeSessions =
    user?.role === Role.EventManager || user?.role === Role.FnBHead || user?.role === Role.Housekeeping;
  // Sessions & Items tab only — narrower than canSeeSessions above (see the
  // comment block above for why Housekeeping is excluded here specifically).
  const canSeeItems = user?.role === Role.EventManager || user?.role === Role.FnBHead;
  // Housekeeping/F&B-Head-only, not also Event Manager — this is the
  // Sessions list's own read-only Setup/Menu *summary* (SessionsTab's own
  // prop comment explains why), and Event Manager's view must stay
  // unchanged by this story; they already reach full Setup/Item detail via
  // "Edit".
  const canSeeSetup = user?.role === Role.Housekeeping;
  const canSeeMenu = user?.role === Role.FnBHead;
  // The Client Details tab's contacts: every role (STORY-046 gave them to
  // F&B Head/Reception; CR-1 D17 adds Housekeeping, read-only, so that
  // role's default landing tab is no longer empty). An explicit role flag,
  // not just `event.clientContacts &&`, matching every other tab-level gate.
  const canSeeClientContacts =
    user?.role === Role.EventManager ||
    user?.role === Role.FnBHead ||
    user?.role === Role.Housekeeping ||
    user?.role === Role.Reception;
  const canEdit = user?.role === Role.EventManager;

  let content: ReactNode;
  if (!id || eventQuery.isPending) {
    content = <PageLoader caption="Loading event" />;
  } else if (eventQuery.isError) {
    const error = eventQuery.error;
    const isNotFound = !(error instanceof Error) && error.status === 404;
    const illustration: IllustrationName = isNotFound ? 'not-found' : 'something-went-wrong';
    const message = isNotFound ? 'No Event with that id.' : 'Something went wrong. Please try again.';
    content = (
      <ErrorState
        illustration={illustration}
        message={message}
        link={{ label: 'Back to Events', to: EVENT_LIST_PATH }}
      />
    );
  } else {
    const event = eventQuery.data.body;

    let tabPanel: ReactNode;
    // Every branch re-checks its own `canSeeX` flag (not just the Tabs
    // strip below) — defense in depth against `activeTab` somehow holding a
    // value its own Tab was never rendered for, same double-check
    // Activity/Payments/Documents already established. `event.payment`/
    // `event.accommodation` are additionally checked directly (not just
    // implied by the role flag) since GET /events/:id's own filtered
    // response schema (STORY-052) types them `.optional()` — narrowing
    // TypeScript needs to see, not a redundant runtime gate: whenever
    // `canSeePayments`/`canSeeRooms` is true, the field is always actually
    // there (filterEventForRole's own EventManager/Housekeeping/Reception
    // branches never omit it), so this never changes real behavior.
    if (activeTab === 'activity' && canSeeActivity) {
      tabPanel = <ActivityTab entityType="Event" entityId={event.id} />;
    } else if (activeTab === 'payments' && canSeePayments && event.payment) {
      tabPanel = (
        <PaymentsTab
          key={event.id}
          eventId={event.id}
          payment={event.payment}
          onEventChanged={() => eventQuery.refetch()}
        />
      );
    } else if (activeTab === 'documents' && canSeeDocuments) {
      tabPanel = <DocumentsTab key={event.id} event={event} onEventChanged={() => eventQuery.refetch()} />;
    } else if (activeTab === 'accommodation' && canSeeRooms && event.accommodation) {
      tabPanel = (
        <RoomsTab
          key={event.id}
          eventId={event.id}
          accommodation={event.accommodation}
          canEdit={canEdit}
          onEventChanged={() => eventQuery.refetch()}
        />
      );
    } else if (activeTab === 'sessions-items' && canSeeItems) {
      tabPanel = (
        <SessionsItemsTab key={event.id} event={event} canEdit={canEdit} onEventChanged={() => eventQuery.refetch()} />
      );
    } else if (activeTab === 'event-details' && canSeeSessions) {
      tabPanel = (
        <SessionsTab
          key={event.id}
          event={event}
          canEdit={canEdit}
          canSeeSetup={canSeeSetup}
          canSeeMenu={canSeeMenu}
          onEventChanged={() => eventQuery.refetch()}
        />
      );
    } else if (activeTab === 'review' && canEdit) {
      tabPanel = (
        <ReviewTab key={event.id} event={event} canEdit={canEdit} onEventChanged={() => eventQuery.refetch()} />
      );
    } else {
      tabPanel = (
        <ClientDetailsTab
          key={event.id}
          event={event}
          canEdit={canEdit}
          canSeeClientContacts={canSeeClientContacts}
          onEventChanged={() => eventQuery.refetch()}
        />
      );
    }

    content = (
      <>
        {/* Not scoped to any one tab — deleting an Event deletes the whole
            record, so it lives in the page header. */}
        <EventDetailHeader
          event={event}
          summary={computeEventSummary(event, canEdit)}
          isDesktop={isDesktop}
          canEdit={canEdit}
          onDelete={() => setIsDeleteDialogOpen(true)}
          notesPath={notesForDepartmentPath(event.id)}
        />
        {/* Pill tabs, scrollable — up to 8 for an Event Manager; MUI keeps
            the active tab scrolled into view on a phone. */}
        <Tabs
          value={activeTab}
          onChange={(_changeEvent, value: DetailTab) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons={false}
          aria-label="Event sections"
          sx={tabsStyles}
        >
          <Tab label="Client Details" value="client-details" />
          {canSeeSessions && <Tab label="Event Details" value="event-details" />}
          {canSeeRooms && <Tab label="Accommodation" value="accommodation" />}
          {canSeeItems && <Tab label="Sessions & Items" value="sessions-items" />}
          {canEdit && <Tab label="Review & Quotation" value="review" />}
          {canSeePayments && <Tab label="Payments" value="payments" />}
          {canSeeDocuments && <Tab label="Documents" value="documents" />}
          {canSeeActivity && <Tab label="Activity" value="activity" />}
        </Tabs>
        <Box sx={tabPanelStyles}>{tabPanel}</Box>
        {canEdit && (
          <DeleteEventDialog
            eventId={event.id}
            eventDisplayId={event.eventId}
            open={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
          />
        )}
      </>
    );
  }

  return <Box sx={pageStyles}>{content}</Box>;
};

export default EventDetailPage;
