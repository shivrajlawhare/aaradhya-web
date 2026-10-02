import type { ReactNode } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { actionsStyles, dialogStyles } from './responsive-dialog.styles';

interface ConfirmDestructiveDialogProps {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// Figma Dialog/Confirm Destructive: Cancel (focused by default — the safer
// choice) and the destructive confirm. A bottom sheet on mobile. While the
// action is in flight neither button works and the dialog can't be
// dismissed.
const ConfirmDestructiveDialog = ({
  open,
  title,
  body,
  confirmLabel,
  isPending,
  onConfirm,
  onClose,
}: ConfirmDestructiveDialogProps) => {
  const theme = useTheme();
  const isBottomSheet = !useMediaQuery(theme.breakpoints.up('md'));
  const handleClose = isPending ? undefined : onClose;

  return (
    <Dialog open={open} onClose={handleClose} sx={dialogStyles(isBottomSheet)}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{body}</DialogContentText>
      </DialogContent>
      <DialogActions sx={actionsStyles(isBottomSheet)}>
        <Button variant="outlined" onClick={onClose} autoFocus disabled={isPending}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={isPending}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDestructiveDialog;
