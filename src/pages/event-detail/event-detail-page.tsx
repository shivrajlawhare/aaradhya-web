import { useState, type ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Box, CircularProgress, Link, Tab, Tabs, Typography } from '@mui/material';
import { tsr } from '../../api/client';
import ActivityTab from '../../components/ui/activity-tab';
import StatusChip from '../../components/ui/status-chip';
import { Role } from '../../contract';
import { EVENT_LIST_PATH } from '../../routes';
import { useAuth } from '../../stores/auth-context';
import OverviewTab from './overview-tab';
import PaymentsTab from './payments-tab';
import RoomsTab from './rooms-tab';
import { headerStyles, pageStyles, tabPanelStyles } from './event-detail-page.styles';

type DetailTab = 'overview' | 'rooms' | 'payments' | 'activity';

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
  // Rooms, unlike Activity/Payments, is NOT EventManager-only to view —
  // GET /events/:id (which now includes accommodation, STORY-020) has no
  // role restriction, and SRS §3.4 explicitly lists "rooms booked" as
  // something Reception sees. canEdit still gates the actual editing
  // controls, exactly like Overview already does for status/Client
  // Contacts.
  const canSeeActivity = user?.role === Role.EventManager;
  const canSeePayments = user?.role === Role.EventManager;
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
    if (activeTab === 'activity' && canSeeActivity) {
      tabPanel = <ActivityTab entityType="Event" entityId={event.id} />;
    } else if (activeTab === 'payments' && canSeePayments) {
      tabPanel = <PaymentsTab key={event.id} event={event} onEventChanged={() => eventQuery.refetch()} />;
    } else if (activeTab === 'rooms') {
      tabPanel = (
        <RoomsTab key={event.id} event={event} canEdit={canEdit} onEventChanged={() => eventQuery.refetch()} />
      );
    } else {
      tabPanel = (
        <OverviewTab
          key={event.id}
          event={event}
          canEdit={canEdit}
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
          <Tab label="Rooms" value="rooms" />
          {canSeePayments && <Tab label="Payments" value="payments" />}
          {canSeeActivity && <Tab label="Activity" value="activity" />}
        </Tabs>
        <Box sx={tabPanelStyles}>{tabPanel}</Box>
      </>
    );
  }

  return <Box sx={pageStyles}>{content}</Box>;
};

export default EventDetailPage;
