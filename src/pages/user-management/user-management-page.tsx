import { type ReactNode, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import ConfirmDestructiveDialog from '../../components/ui/confirm-destructive-dialog';
import PageLoader from '../../components/ui/page-loader';
import { useToast } from '../../components/ui/toast-provider';
import type { userResultSchema } from '../../contract';
import NewUserForm from './new-user-form';
import { contentStyles, mobileSectionStyles, pageStyles } from './user-management-page.styles';
import UsersCardList from './users-card-list';
import UsersTable from './users-table';

type PublicUser = z.infer<typeof userResultSchema>;

const USERS_QUERY_KEY = ['users'];
const DELETED_MESSAGE = 'User deleted.';
const DELETE_ERROR = 'Something went wrong. Please try again.';

// The 5B.3 copy for the delete confirm (D15).
const deleteDialogBody = (name: string) =>
  `${name} will be removed from User Management and will no longer be able to log in. Their past activity stays in the history.`;

const UserManagementPage = () => {
  const usersQuery = tsr.listUsers.useQuery({ queryKey: USERS_QUERY_KEY });
  const theme = useTheme();
  // 900px — MUI's own `md` breakpoint, matching AppShell's (STORY-053) and
  // the Events List's own (STORY-055).
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { showSuccess, showError } = useToast();
  // Mobile only — "Add User" toggles the same NewUserForm desktop shows
  // inline, opening below the button.
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  // CR-1 D15 — the user whose delete is being confirmed.
  const [userToDelete, setUserToDelete] = useState<PublicUser | null>(null);

  const refetchUsers = () => {
    usersQuery.refetch();
  };

  const deleteUserMutation = tsr.deleteUser.useMutation({
    onSuccess: () => {
      showSuccess(DELETED_MESSAGE);
      setUserToDelete(null);
      refetchUsers();
    },
    onError: (error) => {
      // A 400 carries the API's own reason (e.g. "Event Managers can't be
      // deleted."); anything else gets the generic message.
      let message = DELETE_ERROR;
      if (!(error instanceof Error) && error.status === 400) {
        message = error.body.error.message;
      }
      showError(message);
      setUserToDelete(null);
    },
  });

  const handleMobileUserCreated = () => {
    refetchUsers();
    setMobileFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate({ params: { id: userToDelete.id } });
    }
  };

  if (usersQuery.isPending) {
    return (
      <Box sx={pageStyles}>
        <PageLoader caption="Loading users" />
      </Box>
    );
  }

  const users = usersQuery.data?.body ?? [];

  let listSlot: ReactNode;
  if (isDesktop) {
    listSlot = (
      <Stack direction="row" sx={contentStyles}>
        <NewUserForm onCreated={refetchUsers} />
        <UsersTable users={users} onChanged={refetchUsers} onDelete={setUserToDelete} />
      </Stack>
    );
  } else {
    listSlot = (
      <Box sx={mobileSectionStyles}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          fullWidth
          onClick={() => setMobileFormOpen((open) => !open)}
        >
          Add User
        </Button>
        {mobileFormOpen && <NewUserForm onCreated={handleMobileUserCreated} />}
        <UsersCardList users={users} onChanged={refetchUsers} onDelete={setUserToDelete} />
      </Box>
    );
  }

  return (
    <Box sx={pageStyles}>
      {listSlot}
      {userToDelete && (
        <ConfirmDestructiveDialog
          open
          title={`Delete ${userToDelete.name}?`}
          body={deleteDialogBody(userToDelete.name)}
          confirmLabel="Delete user"
          isPending={deleteUserMutation.isPending}
          onConfirm={handleConfirmDelete}
          onClose={() => setUserToDelete(null)}
        />
      )}
    </Box>
  );
};

export default UserManagementPage;
