import { type ReactNode, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { z } from 'zod';
import EmptyState from '../../components/ui/empty-state';
import { formatSetup } from '../../components/ui/format-setup';
import { type filteredEventResultSchema, ItemType } from '../../contract';
import { formatEventDate } from '../../utils/quotation-formatting';
import { toDateInputValue } from './date-input';
import SessionForm from './session-form';
import {
  addButtonStyles,
  cardHeaderStyles,
  cardStyles,
  detailIconStyles,
  detailLineStyles,
  gridStyles,
} from './sessions-tab.styles';
import { tabSectionStyles } from './tab-card.styles';

type PublicEvent = z.infer<typeof filteredEventResultSchema>;
type SessionResult = PublicEvent['sessions'][number];

// "Lunch (12:00-14:00), Dinner (19:00-21:00)" — Meal Items only, same
// "menu" scope SRS §3.2 means for F&B Head; an Event Item (Muhurta, Cake
// Cutting) isn't menu content. "—" when a role permitted to see the Menu
// at all still has none entered for this session yet. Not the dashboard's
// own formatMeals — that operates on a different, pre-trimmed shape
// (dashboardUpcomingMealResultSchema has no `type` field at all, since
// aaradhya-api's own dashboard row already pre-filters to Meal Items
// server-side); this one reads the full itemResultSchema shape and has to
// do that filtering itself.
const formatMenu = (items: SessionResult['items']): string => {
  const mealItems = (items ?? []).filter((item) => item.type === ItemType.Meal);
  if (mealItems.length === 0) {
    return '—';
  }
  return mealItems
    .map((item) => {
      const timing = item.startTime && item.endTime ? ` (${item.startTime}-${item.endTime})` : '';
      return `${item.mealName ?? 'Meal'}${timing}`;
    })
    .join(', ');
};

interface SessionsTabProps {
  event: PublicEvent;
  // Only an Event Manager gets Add/Edit controls — the Session write
  // routes (STORY-027/STORY-028) are EventManager-only on the backend,
  // same reasoning OverviewTab/RoomsTab already apply to their own
  // editing controls. Every role still sees the list itself: the SRS
  // lists venue/pax/date(s) under every role's own "Sees:" scope, and
  // Housekeeping's explicitly includes "seating/setup requirements."
  canEdit: boolean;
  // Setup/Menu detail per row (STORY-052) — this tab itself is already
  // gated to EventManager/F&B Head/Housekeeping at the parent
  // (event-detail-page.tsx's own canSeeSessions), but *within* it, Setup
  // is Housekeeping-only and Menu is F&B-Head-only (SRS §3.2's "does not
  // see... non-food setup details", §3.3's "does not see menu"). Only
  // true for those two roles, not also Event Manager — this story's own
  // regression AC requires "Event Manager's view is unchanged", and the
  // Event Manager already sees full Setup/Item detail one click away via
  // "Edit"; adding a second, read-only summary to their own list view
  // would be new content this story doesn't ask for. session.setup/
  // session.items are also `.optional()` now (STORY-052's own
  // filteredSessionResultSchema) regardless of these flags — undefined
  // for a role that can't see them at all, same as every other
  // role-filtered field on this page.
  canSeeSetup: boolean;
  canSeeMenu: boolean;
  onEventChanged: () => void;
}

type Mode = 'list' | 'create' | 'edit';

const SessionsTab = ({ event, canEdit, canSeeSetup, canSeeMenu, onEventChanged }: SessionsTabProps) => {
  const [mode, setMode] = useState<Mode>('list');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  const handleSaved = () => {
    setMode('list');
    setEditingSessionId(null);
    onEventChanged();
  };

  const handleCancel = () => {
    setMode('list');
    setEditingSessionId(null);
  };

  if (mode === 'create') {
    return <SessionForm eventId={event.id} onSaved={handleSaved} onCancel={handleCancel} />;
  }

  const editingSession = event.sessions.find((session) => session.id === editingSessionId);
  if (mode === 'edit' && editingSession) {
    return <SessionForm eventId={event.id} session={editingSession} onSaved={handleSaved} onCancel={handleCancel} />;
  }

  const handleEdit = (sessionId: string) => {
    setEditingSessionId(sessionId);
    setMode('edit');
  };

  // D12: DD/MM/YYYY dates and pax, no session status chip.
  let sessionList: ReactNode;
  if (event.sessions.length === 0) {
    sessionList = <EmptyState illustration="no-sessions" title="No Sessions yet." />;
  } else {
    sessionList = (
      <Box component="ul" aria-label="Sessions" sx={gridStyles}>
        {event.sessions.map((session) => (
          <Box key={session.id} component="li" sx={cardStyles}>
            <Box sx={cardHeaderStyles}>
              <Typography variant="titleS" component="h3">
                {session.sessionType} — {session.venue}
              </Typography>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="small"
                  startIcon={<EditOutlinedIcon />}
                  aria-label={`Edit ${session.sessionType} session`}
                  onClick={() => handleEdit(session.id)}
                >
                  Edit
                </Button>
              )}
            </Box>
            <Box sx={detailLineStyles}>
              <CalendarTodayOutlinedIcon aria-hidden sx={detailIconStyles} />
              <Typography variant="bodyM" component="span">
                {formatEventDate(toDateInputValue(session.startDate))} to{' '}
                {formatEventDate(toDateInputValue(session.endDate))} · {session.pax} pax
              </Typography>
            </Box>
            {canSeeSetup && <Typography variant="bodyM">Setup: {formatSetup(session.setup)}</Typography>}
            {canSeeMenu && <Typography variant="bodyM">Menu: {formatMenu(session.items)}</Typography>}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Stack sx={tabSectionStyles}>
      {sessionList}
      {canEdit && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setMode('create')} sx={addButtonStyles}>
          Add Session
        </Button>
      )}
    </Stack>
  );
};

export default SessionsTab;
