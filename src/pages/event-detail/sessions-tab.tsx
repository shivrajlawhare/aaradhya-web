import { useState } from 'react';
import { Button, List, ListItem, Stack, Typography } from '@mui/material';
import type { z } from 'zod';
import type { eventResultSchema } from '../../contract';
import { toDateInputValue } from './date-input';
import SessionForm from './session-form';
import { listStyles, rowStyles, sectionStyles } from './sessions-tab.styles';

type PublicEvent = z.infer<typeof eventResultSchema>;

interface SessionsTabProps {
  event: PublicEvent;
  // Only an Event Manager gets Add/Edit controls — the Session write
  // routes (STORY-027/STORY-028) are EventManager-only on the backend,
  // same reasoning OverviewTab/RoomsTab already apply to their own
  // editing controls. Every role still sees the list itself: the SRS
  // lists venue/pax/date(s) under every role's own "Sees:" scope, and
  // Housekeeping's explicitly includes "seating/setup requirements."
  canEdit: boolean;
  onEventChanged: () => void;
}

type Mode = 'list' | 'create' | 'edit';

const SessionsTab = ({ event, canEdit, onEventChanged }: SessionsTabProps) => {
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
    return (
      <SessionForm
        eventId={event.id}
        session={editingSession}
        onSaved={handleSaved}
        onCancel={handleCancel}
        onItemsChanged={onEventChanged}
      />
    );
  }

  return (
    <Stack sx={sectionStyles}>
      {event.sessions.length === 0 ? (
        <Typography variant="bodyM">No Sessions yet.</Typography>
      ) : (
        <List sx={listStyles} disablePadding>
          {event.sessions.map((session, index) => (
            <ListItem key={session.id} sx={rowStyles} divider={index < event.sessions.length - 1}>
              <Stack>
                <Typography variant="bodyL">
                  {session.sessionType} — {session.venue}
                </Typography>
                <Typography variant="bodyM">
                  {toDateInputValue(session.startDate)} to {toDateInputValue(session.endDate)} · {session.pax} pax
                </Typography>
              </Stack>
              {canEdit && (
                <Button
                  onClick={() => {
                    setEditingSessionId(session.id);
                    setMode('edit');
                  }}
                >
                  Edit
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      )}
      {canEdit && (
        <Button variant="contained" onClick={() => setMode('create')}>
          Add Session
        </Button>
      )}
    </Stack>
  );
};

export default SessionsTab;
