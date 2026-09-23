import { Box, MenuItem, Paper, Select, type SelectChangeEvent, Switch, Typography } from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import { Role, ROLE_OPTIONS, type userResultSchema } from '../../contract';
import {
  actionsRowStyles,
  activeStatusStyles,
  cardStyles,
  headerRowStyles,
  inactiveStatusStyles,
  listStyles,
  roleSelectStyles,
  roleStyles,
} from './users-card-list.styles';

type PublicUser = z.infer<typeof userResultSchema>;

interface UsersCardListProps {
  users: PublicUser[];
  onChanged: () => void;
}

// Below `md`, UserManagementPage renders this instead of UsersTable — same
// Name/Role/Active data as the desktop table, one card per user (STORY-056,
// same responsive pattern as the Events List's own STORY-055). Now also
// carries the same role-change Select and active-toggle Switch the desktop
// table has — this view used to be display-only, which left mobile with no
// way to actually update a user at all (unlike every other role-gated
// screen's own table/card-list split, which only ever changes *how much*
// is shown, never *whether an action is reachable*).
const UsersCardList = ({ users, onChanged }: UsersCardListProps) => {
  const updateUserMutation = tsr.updateUser.useMutation({ onSuccess: onChanged });

  const handleToggleActive = (user: PublicUser) => {
    updateUserMutation.mutate({ params: { id: user.id }, body: { active: !user.active } });
  };

  const handleRoleChange = (user: PublicUser, event: SelectChangeEvent<Role>) => {
    updateUserMutation.mutate({ params: { id: user.id }, body: { role: event.target.value } });
  };

  return (
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
              {user.username}
            </Typography>
            <Box sx={actionsRowStyles}>
              <Select<Role>
                value={user.role}
                size="small"
                disabled={updateUserMutation.isPending}
                onChange={(event) => handleRoleChange(user, event)}
                sx={roleSelectStyles}
              >
                {ROLE_OPTIONS.map((roleOption) => (
                  <MenuItem key={roleOption} value={roleOption}>
                    {roleOption}
                  </MenuItem>
                ))}
              </Select>
              <Switch
                checked={user.active}
                disabled={updateUserMutation.isPending}
                onChange={() => handleToggleActive(user)}
                slotProps={{ input: { 'aria-label': `Toggle active for ${user.username}` } }}
              />
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};

export default UsersCardList;
