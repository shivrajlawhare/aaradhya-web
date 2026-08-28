import {
  Chip,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import { ROLE_OPTIONS, Role, type userResultSchema } from '../../contract';
import { activeChipStyles, inactiveChipStyles, tableCardStyles } from './users-table.styles';

type PublicUser = z.infer<typeof userResultSchema>;

interface UsersTableProps {
  users: PublicUser[];
  onChanged: () => void;
}

const UsersTable = ({ users, onChanged }: UsersTableProps) => {
  const updateUserMutation = tsr.updateUser.useMutation({ onSuccess: onChanged });

  const handleToggleActive = (user: PublicUser) => {
    updateUserMutation.mutate({ params: { id: user.id }, body: { active: !user.active } });
  };

  const handleRoleChange = (user: PublicUser, event: SelectChangeEvent<Role>) => {
    updateUserMutation.mutate({ params: { id: user.id }, body: { role: event.target.value } });
  };

  const renderRow = (user: PublicUser) => {
    const statusLabel = user.active ? 'Active' : 'Inactive';
    const statusStyles = user.active ? activeChipStyles : inactiveChipStyles;

    return (
      <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.username}</TableCell>
        <TableCell>
          <Select<Role>
            value={user.role}
            size="small"
            disabled={updateUserMutation.isPending}
            onChange={(event) => handleRoleChange(user, event)}
          >
            {ROLE_OPTIONS.map((roleOption) => (
              <MenuItem key={roleOption} value={roleOption}>
                {roleOption}
              </MenuItem>
            ))}
          </Select>
        </TableCell>
        <TableCell>
          <Chip label={statusLabel} size="small" sx={statusStyles} />
          <Switch
            checked={user.active}
            disabled={updateUserMutation.isPending}
            onChange={() => handleToggleActive(user)}
            slotProps={{ input: { 'aria-label': `Toggle active for ${user.username}` } }}
          />
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Paper sx={tableCardStyles}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant="labelS">Name</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="labelS">Username</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="labelS">Role</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="labelS">Active</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{users.map(renderRow)}</TableBody>
      </Table>
    </Paper>
  );
};

export default UsersTable;
