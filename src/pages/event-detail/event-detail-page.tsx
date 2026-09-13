import { useState, type ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Box, CircularProgress, Link, Tab, Tabs, Typography } from '@mui/material';
import { tsr } from '../../api/client';
import ActivityTab from '../../components/ui/activity-tab';
import StatusChip from '../../components/ui/status-chip';
import { Role } from '../../contract';
import { EVENT_LIST_PATH } from '../../routes';
import { useAuth } from '../../stores/auth-context';
import DocumentsTab from './documents-tab';
import OverviewTab from './overview-tab';
import PaymentsTab from './payments-tab';
import RoomsTab from './rooms-tab';
import SessionsTab from './sessions-tab';
import { headerStyles, pageStyles, tabPanelStyles } from './event-detail-page.styles';

type DetailTab = 'overview' | 'rooms' | 'sessions' | 'payments' | 'documents' | 'activity';

const EventDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

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
  // list, restated as this screen's tab-visibility matrix:
  // EventManager: Overview, Rooms, Sessions (Setup+Menu), Payments,
  //   Documents, Activity — unchanged (this story's own regression AC).
  // F&B Head (§3.2): Overview (filtered) + Sessions (Menu, no Setup). No
  //   Rooms — §3.2 never mentions accommodation/rooms.
  // Housekeeping (§3.3): Overview (filtered) + Rooms + Sessions (Setup, no
  //   Menu).
  // Reception (§3.4): Overview (filtered) + Rooms. No Sessions at all —
  //   this story's own explicit bullet ("Payments and Sessions & Menu are
  //   absent"), even though §3.4 itself lists venue/pax/date(s) among what
  //   Reception sees; the AC's own literal tab list wins over re-deriving
  //   a looser rule from the field-visibility table.
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
  // Housekeeping/F&B-Head-only, not also Event Manager — this is the
  // Sessions list's own read-only Setup/Menu *summary* (SessionsTab's own
  // prop comment explains why), and Event Manager's view must stay
  // unchanged by this story; they already reach full Setup/Item detail via
  // "Edit".
  const canSeeSetup = user?.role === Role.Housekeeping;
  const canSeeMenu = user?.role === Role.FnBHead;
  // Overview's own Client Contacts section (STORY-046: F&B Head/Reception
  // see it, Housekeeping doesn't) — an explicit role flag, not just
  // `event.clientContacts &&` alone, matching every other tab-level content
  // gate on this page (Payments/Rooms already pair a role flag with a
  // field-presence check). Passed down so OverviewTab doesn't have to
  // re-derive it from `user` itself.
  const canSeeClientContacts =
    user?.role === Role.EventManager || user?.role === Role.FnBHead || user?.role === Role.Reception;
  const canEdit = user?.role === Role.EventManager;

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
    } else if (activeTab === 'rooms' && canSeeRooms && event.accommodation) {
      tabPanel = (
        <RoomsTab
          key={event.id}
          eventId={event.id}
          accommodation={event.accommodation}
          canEdit={canEdit}
          onEventChanged={() => eventQuery.refetch()}
        />
      );
    } else if (activeTab === 'sessions' && canSeeSessions) {
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
    } else {
      tabPanel = (
        <OverviewTab
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
        <Box sx={headerStyles}>
          <Typography variant="titleL" component="h1">
            {event.eventId}
          </Typography>
          <StatusChip status={event.status} />
          <Typography variant="bodyM">{event.eventFamilyType}</Typography>
        </Box>
        <Tabs value={activeTab} onChange={(_changeEvent, value: DetailTab) => setActiveTab(value)}>
          <Tab label="Overview" value="overview" />
          {canSeeRooms && <Tab label="Rooms" value="rooms" />}
          {canSeeSessions && <Tab label="Sessions" value="sessions" />}
          {canSeePayments && <Tab label="Payments" value="payments" />}
          {canSeeDocuments && <Tab label="Documents" value="documents" />}
          {canSeeActivity && <Tab label="Activity" value="activity" />}
        </Tabs>
        <Box sx={tabPanelStyles}>{tabPanel}</Box>
      </>
    );
  }

  return <Box sx={pageStyles}>{content}</Box>;
};

export default EventDetailPage;
