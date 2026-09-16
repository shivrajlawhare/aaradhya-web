import { Box, Paper, Typography } from '@mui/material';
import type { z } from 'zod';
import type { userResultSchema } from '../../contract';
import {
  activeStatusStyles,
  cardStyles,
  headerRowStyles,
  inactiveStatusStyles,
  listStyles,
  roleStyles,
} from './users-card-list.styles';

type PublicUser = z.infer<typeof userResultSchema>;

interface UsersCardListProps {
  users: PublicUser[];
}

// Below `md`, UserManagementPage renders this instead of UsersTable — same
// Name/Role/Active data as the desktop table, one card per user (STORY-056,
// same responsive pattern as the Events List's own STORY-055). Read-only:
// unlike the desktop table, this view has no inline role-change or
// active-toggle controls — this story's own AC describes display only.
const UsersCardList = ({ users }: UsersCardListProps) => (
  <Box sx={listStyles}>
    {users.map((user) => {
      const statusLabel = user.active ? 'Active' : 'Inactive';
      const statusStyles = user.active ? activeStatusStyles : inactiveStatusStyles;

      return (
        <Paper key={user.id} elevation={0} sx={cardStyles(user.active)}>
          <Box sx={headerRowStyles}>
            <Typography variant="titleM">{user.name}</Typography>
            <Typography variant="labelS" sx={statusStyles}>
              {statusLabel}
            </Typography>
          </Box>
          <Typography variant="bodyM" sx={roleStyles}>
            {user.role}
          </Typography>
        </Paper>
      );
    })}
  </Box>
);

export default UsersCardList;
