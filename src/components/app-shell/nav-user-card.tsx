import { Avatar, Box, Chip, Typography } from '@mui/material';
import type { AuthUser } from '../../stores/auth-context';
import { getInitials } from '../../utils/initials';
import { getRoleLabel } from '../../utils/role-labels';
import {
  avatarStyles,
  roleChipStyles,
  userCardStyles,
  userDetailsStyles,
  userNameStyles,
} from './nav-user-card.styles';

interface NavUserCardProps {
  user: AuthUser;
}

const NavUserCard = ({ user }: NavUserCardProps) => (
  <Box sx={userCardStyles}>
    <Avatar sx={avatarStyles}>
      <Typography variant="labelL" component="span" aria-hidden>
        {getInitials(user.name)}
      </Typography>
    </Avatar>
    <Box sx={userDetailsStyles}>
      <Typography variant="labelL" sx={userNameStyles}>
        {user.name}
      </Typography>
      <Chip size="small" label={getRoleLabel(user.role)} sx={roleChipStyles} />
    </Box>
  </Box>
);

export default NavUserCard;
