import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { Chip, IconButton, MenuItem, Select, type SxProps, type Theme } from '@mui/material';
import { Role, ROLE_OPTIONS } from '../../contract';
import { getRoleLabel } from '../../utils/role-labels';
import { deleteButtonStyles, statusChipStyles } from './user-controls.styles';

interface RoleSelectProps {
  role: Role;
  userName: string;
  disabled: boolean;
  onChange: (role: Role) => void;
  sx?: SxProps<Theme>;
}

// The inline role select, showing the friendly labels (CR-1 D11) while the
// stored enum values stay unchanged.
export const RoleSelect = ({ role, userName, disabled, onChange, sx }: RoleSelectProps) => (
  <Select<Role>
    value={role}
    size="small"
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
    renderValue={getRoleLabel}
    inputProps={{ 'aria-label': `Role for ${userName}` }}
    sx={sx}
  >
    {ROLE_OPTIONS.map((roleOption) => (
      <MenuItem key={roleOption} value={roleOption}>
        {getRoleLabel(roleOption)}
      </MenuItem>
    ))}
  </Select>
);

interface UserStatusChipProps {
  active: boolean;
}

// Figma Chip/Status "• Active" (green) / "• Inactive" (muted).
export const UserStatusChip = ({ active }: UserStatusChipProps) => {
  let label = 'Inactive';
  if (active) {
    label = 'Active';
  }
  return <Chip label={label} size="small" sx={statusChipStyles(active)} />;
};

interface DeleteUserButtonProps {
  userName: string;
  onClick: () => void;
}

// CR-1 D15 — the destructive icon button; callers show it for non-Event
// Manager users only.
export const DeleteUserButton = ({ userName, onClick }: DeleteUserButtonProps) => (
  <IconButton aria-label={`Delete ${userName}`} onClick={onClick} sx={deleteButtonStyles}>
    <DeleteOutlineRoundedIcon fontSize="small" />
  </IconButton>
);

// Event Managers can't be deleted (D15; the API refuses too).
export const canDeleteUser = (role: Role): boolean => role !== Role.EventManager;
