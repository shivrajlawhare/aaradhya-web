import { useState, type ReactNode } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, CircularProgress, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { tsr } from '../../api/client';
import NewUserForm from './new-user-form';
import UsersCardList from './users-card-list';
import UsersTable from './users-table';
import { contentStyles, mobileSectionStyles, pageStyles } from './user-management-page.styles';

const USERS_QUERY_KEY = ['users'];

const UserManagementPage = () => {
  const usersQuery = tsr.listUsers.useQuery({ queryKey: USERS_QUERY_KEY });
  const theme = useTheme();
  // 900px — MUI's own `md` breakpoint, matching AppShell's (STORY-053) and
  // the Events List's own (STORY-055).
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  // Mobile only — the "+ Add User" button (this story's own AC) toggles the
  // same NewUserForm desktop already shows inline; unlike New Event
  // (STORY-055), there's no separate route to send it to.
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const refetchUsers = () => {
    usersQuery.refetch();
  };

  const handleMobileUserCreated = () => {
    refetchUsers();
    setMobileFormOpen(false);
  };

  if (usersQuery.isPending) {
    return (
      <Box sx={pageStyles}>
        <CircularProgress aria-label="Loading users" />
      </Box>
    );
  }

  const users = usersQuery.data?.body ?? [];

  let listSlot: ReactNode;
  if (isDesktop) {
    listSlot = (
      <Stack direction="row" sx={contentStyles}>
        <NewUserForm onCreated={refetchUsers} />
        <UsersTable users={users} onChanged={refetchUsers} />
      </Stack>
    );
  } else {
    listSlot = (
      <Box sx={mobileSectionStyles}>
        <Button variant="contained" startIcon={<AddIcon />} fullWidth onClick={() => setMobileFormOpen((open) => !open)}>
          Add User
        </Button>
        {mobileFormOpen && <NewUserForm onCreated={handleMobileUserCreated} />}
        <UsersCardList users={users} onChanged={refetchUsers} />
      </Box>
    );
  }

  return <Box sx={pageStyles}>{listSlot}</Box>;
};

export default UserManagementPage;
