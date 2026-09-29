import type { ReactNode } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Skeleton, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { tsr } from '../../api/client';
import PageHeader from '../../components/ui/page-header';
import TableSkeleton from '../../components/ui/table-skeleton';
import { visuallyHiddenStyles } from '../../components/ui/visually-hidden.styles';
import { Role } from '../../contract';
import { EVENT_CREATE_PATH } from '../../routes';
import { useAuth } from '../../stores/auth-context';
import {
  cardIdBarStyles,
  cardMetaBarStyles,
  cardSkeletonListStyles,
  cardSkeletonStyles,
  cardTitleBarStyles,
  pageStyles,
} from './event-list-page.styles';
import EventsCardList from './events-card-list';
import EventsTable from './events-table';

const EVENTS_QUERY_KEY = ['events'];
const SKELETON_ROW_COUNT = 6;
// Event ID, Family type, Manager, Bride / Groom — then the status chip bar.
const SKELETON_TEXT_COLUMN_COUNT = 4;

// "6 events" / "1 event" — derived from the loaded list (UI-14).
const formatEventCount = (count: number): string => `${count} ${count === 1 ? 'event' : 'events'}`;

const EventCardsSkeleton = () => (
  <Box sx={cardSkeletonListStyles}>
    {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
      <Box key={index} sx={cardSkeletonStyles}>
        <Skeleton variant="text" sx={cardTitleBarStyles} />
        <Skeleton variant="text" sx={cardIdBarStyles} />
        <Skeleton variant="text" sx={cardMetaBarStyles} />
      </Box>
    ))}
  </Box>
);

const EventListPage = () => {
  const eventsQuery = tsr.listEvents.useQuery({ queryKey: EVENTS_QUERY_KEY });
  const { user } = useAuth();
  const theme = useTheme();
  // 900px — MUI's own `md` breakpoint, matching AppShell's (STORY-053).
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  let newEventButton: ReactNode = null;
  if (user?.role === Role.EventManager) {
    // Beside the title on desktop; full width under it on mobile.
    let buttonSize: 'medium' | 'large' = 'large';
    if (isDesktop) {
      buttonSize = 'medium';
    }
    newEventButton = (
      <Button
        component={RouterLink}
        to={EVENT_CREATE_PATH}
        variant="contained"
        size={buttonSize}
        startIcon={<AddIcon />}
        fullWidth={!isDesktop}
      >
        New Event
      </Button>
    );
  }

  let content: ReactNode;
  let loadingStatus: ReactNode = null;
  let eventCount: string | undefined;
  if (eventsQuery.isPending) {
    loadingStatus = (
      <Box role="status" sx={visuallyHiddenStyles}>
        Loading events
      </Box>
    );
    content = <EventCardsSkeleton />;
    if (isDesktop) {
      content = <TableSkeleton rowCount={SKELETON_ROW_COUNT} textColumnCount={SKELETON_TEXT_COLUMN_COUNT} />;
    }
  } else {
    const events = eventsQuery.data?.body ?? [];
    eventCount = formatEventCount(events.length);
    content = <EventsCardList events={events} />;
    if (isDesktop) {
      content = <EventsTable events={events} />;
    }
  }

  return (
    <Box sx={pageStyles} aria-busy={eventsQuery.isPending}>
      <PageHeader
        eyebrow="All events"
        title="Events"
        supportingText={eventCount}
        actions={newEventButton}
        isTitleHiddenOnMobile
      />
      {loadingStatus}
      {content}
    </Box>
  );
};

export default EventListPage;
