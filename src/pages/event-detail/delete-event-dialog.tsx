import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { tsr } from '../../api/client';
import { useToast } from '../../components/ui/toast-provider';
import { EVENT_LIST_PATH } from '../../routes';

interface DeleteEventDialogProps {
  // The Mongo id — what DELETE /events/:id actually targets.
  eventId: string;
  // The human-readable eventId (e.g. "ARD-EVT-2026-021") — this story's own
  // AC requires the confirmation naming the Event this way, not its Mongo id.
  eventDisplayId: string;
  open: boolean;
  onClose: () => void;
}

// No inline error banner here — a failed delete's own AC only calls for a
// toast (STORY-083) plus staying put, which this dialog already does simply
// by not navigating on error; a second, redundant error surface inside the
// dialog isn't needed on top of that toast.
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
    <Dialog open={open} onClose={deleteEventMutation.isPending ? undefined : onClose}>
      <DialogTitle>Delete {eventDisplayId}?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This permanently deletes {eventDisplayId} — including every Session, Item, Accommodation, Payment, Document,
          and its entire Activity history. This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {/* Cancel is the safer default focus (this story's own UI spec) — not
            the destructive confirm button below. */}
        <Button onClick={onClose} autoFocus disabled={deleteEventMutation.isPending}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="error" disabled={deleteEventMutation.isPending}>
          Delete Event
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteEventDialog;
