import type { ReactNode } from 'react';
import { Box, CircularProgress, Stack } from '@mui/material';
import { tsr } from '../../api/client';
import NewUserForm from './new-user-form';
import UsersTable from './users-table';
import { contentStyles, pageStyles } from './user-management-page.styles';

const USERS_QUERY_KEY = ['users'];

const UserManagementPage = () => {
  const usersQuery = tsr.listUsers.useQuery({ queryKey: USERS_QUERY_KEY });

  const refetchUsers = () => {
    usersQuery.refetch();
  };

  let tableSlot: ReactNode;
  if (usersQuery.isPending) {
    tableSlot = <CircularProgress aria-label="Loading users" />;
  } else {
    tableSlot = <UsersTable users={usersQuery.data?.body ?? []} onChanged={refetchUsers} />;
  }

  return (
    <Box sx={pageStyles}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={contentStyles}>
        <NewUserForm onCreated={refetchUsers} />
        {tableSlot}
      </Stack>
    </Box>
  );
};

export default UserManagementPage;
