import { useNavigate } from 'react-router-dom';
import { tsr } from '../../api/client';
import ConfirmDestructiveDialog from '../../components/ui/confirm-destructive-dialog';
import { useToast } from '../../components/ui/toast-provider';
import { EVENT_LIST_PATH } from '../../routes';

interface DeleteEventDialogProps {
  // The Mongo id — what DELETE /events/:id actually targets.
  eventId: string;
  // The human-readable eventId (e.g. "ARD-EVT-2026-021") — the confirmation
  // names the Event this way, not by its Mongo id.
  eventDisplayId: string;
  open: boolean;
  onClose: () => void;
}

// A failed delete shows a toast and stays put (STORY-083) — no second error
// surface inside the dialog.
const DeleteEventDialog = ({ eventId, eventDisplayId, open, onClose }: DeleteEventDialogProps) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const deleteEventMutation = tsr.deleteEvent.useMutation({
    onSuccess: () => {
      showSuccess('Event deleted.');
      navigate(EVENT_LIST_PATH);
    },
    onError: () => {
      showError('Something went wrong. Please try again.');
    },
  });

  const handleConfirm = () => {
    if (deleteEventMutation.isPending) {
      return;
    }
    deleteEventMutation.mutate({ params: { id: eventId } });
  };

  return (
    <ConfirmDestructiveDialog
      open={open}
      title={`Delete ${eventDisplayId}?`}
      body={`This permanently deletes ${eventDisplayId} — including every Session, Item, Accommodation, Payment, Document, and its entire Activity history. This action cannot be undone.`}
      confirmLabel="Delete Event"
      isPending={deleteEventMutation.isPending}
      onConfirm={handleConfirm}
      onClose={onClose}
    />
  );
};

export default DeleteEventDialog;
