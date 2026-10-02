import { Box, Paper, Switch, Typography } from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import type { Role, userResultSchema } from '../../contract';
import { canDeleteUser, DeleteUserButton, RoleSelect, UserStatusChip } from './user-controls';
import {
  actionsRowStyles,
  cardStyles,
  headerRowStyles,
  listStyles,
  roleSelectStyles,
  usernameStyles,
} from './users-card-list.styles';

type PublicUser = z.infer<typeof userResultSchema>;

interface UsersCardListProps {
  users: PublicUser[];
  onChanged: () => void;
  onDelete: (user: PublicUser) => void;
}

// Below `md`, UserManagementPage renders this instead of UsersTable (Figma
// Card/User, UI-28/UI-43): name + status chip, username, then the role
// select, the active switch and — for non-Event Managers — delete. Every
// action the desktop table has is reachable here too.
const UsersCardList = ({ users, onChanged, onDelete }: UsersCardListProps) => {
  const updateUserMutation = tsr.updateUser.useMutation({ onSuccess: onChanged });

  const handleToggleActive = (user: PublicUser) => {
    updateUserMutation.mutate({ params: { id: user.id }, body: { active: !user.active } });
  };

  const handleRoleChange = (user: PublicUser, role: Role) => {
    updateUserMutation.mutate({ params: { id: user.id }, body: { role } });
  };

  return (
    <Box component="ul" aria-label="Users" sx={listStyles}>
      {users.map((user) => (
        <Paper component="li" key={user.id} elevation={0} sx={cardStyles(user.active)}>
          <Box sx={headerRowStyles}>
            <Typography variant="titleM" component="h3">
              {user.name}
            </Typography>
            <UserStatusChip active={user.active} />
          </Box>
          <Typography variant="bodyM" sx={usernameStyles}>
            {user.username}
          </Typography>
          <Box sx={actionsRowStyles}>
            <RoleSelect
              role={user.role}
              userName={user.name}
              disabled={updateUserMutation.isPending}
              onChange={(role) => handleRoleChange(user, role)}
              sx={roleSelectStyles}
            />
            <Switch
              checked={user.active}
              disabled={updateUserMutation.isPending}
              onChange={() => handleToggleActive(user)}
              slotProps={{ input: { 'aria-label': `Toggle active for ${user.username}` } }}
            />
            {canDeleteUser(user.role) && <DeleteUserButton userName={user.name} onClick={() => onDelete(user)} />}
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default UsersCardList;
