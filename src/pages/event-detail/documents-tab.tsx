import { type ChangeEvent, useState } from 'react';
import { Alert, List, ListItem, Stack, Switch, Typography } from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import { useToast } from '../../components/ui/toast-provider';
import { DOCUMENT_CHECKLIST_ITEM_KEYS, type filteredEventResultSchema } from '../../contract';
import { listStyles, rowStyles, sectionStyles } from './documents-tab.styles';

type PublicEvent = z.infer<typeof filteredEventResultSchema>;
type DocumentsChecklist = PublicEvent['documentsChecklist'];
type DocumentChecklistItemKey = (typeof DOCUMENT_CHECKLIST_ITEM_KEYS)[number];

// The one place a checklist key maps to its display label — the six keys
// themselves, and their order, come from the shared DOCUMENT_CHECKLIST_ITEM_KEYS
// constant (mirrors STORY-024's server-defined list), so this map only ever
// needs a label, never a new key: no "add item" control exists anywhere on
// this screen (this story's own AC), and there's nowhere for one to go.
const ITEM_LABELS: Record<DocumentChecklistItemKey, string> = {
  aadharCard: 'Aadhar Card',
  panCard: 'PAN Card',
  leavingBirthCertificate: 'Leaving/Birth Certificate',
  rationCard: 'Ration Card',
  passportPhotos: 'Passport Photos',
  weddingCard: 'Wedding Card',
};

interface DocumentsTabProps {
  event: PublicEvent;
  onEventChanged: () => void;
}

interface MutationContext {
  previousChecklist: DocumentsChecklist;
}

// No canEdit prop, unlike Overview/Rooms — this whole tab is only ever
// rendered for an Event Manager (EventDetailPage doesn't even mount it for
// anyone else), so there's no read-only fallback branch to build here. Same
// reasoning PaymentsTab (STORY-023) already documents, applied here because
// the SRS lists the Documents Checklist under the Event Manager's full-access
// scope (§3.1) but never once under F&B Head/Housekeeping/Reception's own
// "Sees:" lists (§3.2-3.4) — the same "not listed for any other role"
// pattern that made Payment Record Event-Manager-only visibility explicit.
const DocumentsTab = ({ event, onEventChanged }: DocumentsTabProps) => {
  const { showSuccess, showError } = useToast();
  const [saveError, setSaveError] = useState<string | null>(null);
  // Drives every switch's checked state. Flipped optimistically the instant
  // a switch is clicked (toggling should feel immediate, not wait on a round
  // trip), then confirmed from the mutation's own response - or rolled back
  // to onMutate's captured snapshot if the request fails.
  const [checklist, setChecklist] = useState<DocumentsChecklist>(event.documentsChecklist);

  const updateChecklistMutation = tsr.updateDocumentsChecklist.useMutation({
    onMutate: (variables): MutationContext => {
      setSaveError(null);
      const previousChecklist = checklist;
      setChecklist((current) => ({ ...current, ...variables.body }));
      return { previousChecklist };
    },
    onSuccess: (response) => {
      setChecklist(response.body);
      showSuccess('Checklist updated.');
      onEventChanged();
    },
    // updateDocumentsChecklist only declares a 404 response (matching the
    // backend contract exactly) — there's no narrower declared error to
    // branch on, same reasoning RoomsTab/PaymentsTab already document for
    // their own mutations.
    onError: (_error, _variables, context) => {
      setSaveError('Something went wrong. Please try again.');
      showError('Something went wrong. Please try again.');
      if (context) {
        setChecklist(context.previousChecklist);
      }
    },
  });

  const handleToggle = (key: DocumentChecklistItemKey) => (changeEvent: ChangeEvent<HTMLInputElement>) => {
    updateChecklistMutation.mutate({
      params: { id: event.id },
      body: { [key]: changeEvent.target.checked },
    });
  };

  return (
    <Stack sx={sectionStyles}>
      <List sx={listStyles} disablePadding>
        {DOCUMENT_CHECKLIST_ITEM_KEYS.map((key, index) => (
          <ListItem key={key} sx={rowStyles} divider={index < DOCUMENT_CHECKLIST_ITEM_KEYS.length - 1}>
            <Typography variant="bodyL">{ITEM_LABELS[key]}</Typography>
            <Switch
              checked={checklist[key]}
              onChange={handleToggle(key)}
              disabled={updateChecklistMutation.isPending}
              slotProps={{ input: { 'aria-label': ITEM_LABELS[key] } }}
            />
          </ListItem>
        ))}
      </List>
      {saveError && (
        <Alert severity="error">
          <Typography variant="bodyM">{saveError}</Typography>
        </Alert>
      )}
    </Stack>
  );
};

export default DocumentsTab;
