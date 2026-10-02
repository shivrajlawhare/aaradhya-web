import { Box, Paper, Switch, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import ActiveStatusChip from '../../components/ui/active-status-chip';
import { visuallyHiddenStyles } from '../../components/ui/visually-hidden.styles';
import type { Role, userResultSchema } from '../../contract';
import { canDeleteUser, DeleteUserButton, RoleSelect } from './user-controls';
import {
  actionsCellStyles,
  activeCellStyles,
  roleCellStyles,
  roleSelectStyles,
  tableCardStyles,
  usernameCellStyles,
} from './users-table.styles';

type PublicUser = z.infer<typeof userResultSchema>;

interface UsersTableProps {
  users: PublicUser[];
  onChanged: () => void;
  onDelete: (user: PublicUser) => void;
}

// Figma Table/Users (UI-28, UI-43): Name fills · Username · Role (inline
// select, friendly labels) · Active (chip + switch) · Actions (delete, for
// non-Event Manager rows only). Role and active changes save immediately.
const UsersTable = ({ users, onChanged, onDelete }: UsersTableProps) => {
  const updateUserMutation = tsr.updateUser.useMutation({ onSuccess: onChanged });

  const handleToggleActive = (user: PublicUser) => {
    updateUserMutation.mutate({ params: { id: user.id }, body: { active: !user.active } });
  };

  const handleRoleChange = (user: PublicUser, role: Role) => {
    updateUserMutation.mutate({ params: { id: user.id }, body: { role } });
  };

  return (
    <Paper elevation={0} sx={tableCardStyles}>
      <Table aria-label="Users">
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant="labelS">Name</Typography>
            </TableCell>
            <TableCell sx={usernameCellStyles}>
              <Typography variant="labelS">Username</Typography>
            </TableCell>
            <TableCell sx={roleCellStyles}>
              <Typography variant="labelS">Role</Typography>
            </TableCell>
            <TableCell sx={activeCellStyles}>
              <Typography variant="labelS">Active</Typography>
            </TableCell>
            <TableCell sx={actionsCellStyles}>
              <Box component="span" sx={visuallyHiddenStyles}>
                Actions
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell sx={usernameCellStyles}>{user.username}</TableCell>
              <TableCell sx={roleCellStyles}>
                <RoleSelect
                  role={user.role}
                  userName={user.name}
                  disabled={updateUserMutation.isPending}
                  onChange={(role) => handleRoleChange(user, role)}
                  sx={roleSelectStyles}
                />
              </TableCell>
              <TableCell sx={activeCellStyles}>
                <ActiveStatusChip active={user.active} />
                <Switch
                  checked={user.active}
                  disabled={updateUserMutation.isPending}
                  onChange={() => handleToggleActive(user)}
                  slotProps={{ input: { 'aria-label': `Toggle active for ${user.username}` } }}
                />
              </TableCell>
              <TableCell sx={actionsCellStyles}>
                {canDeleteUser(user.role) && <DeleteUserButton userName={user.name} onClick={() => onDelete(user)} />}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default UsersTable;
