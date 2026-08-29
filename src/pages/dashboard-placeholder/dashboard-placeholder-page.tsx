import { Box, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Role } from '../../contract';
import { EVENT_CREATE_PATH, USER_MANAGEMENT_PATH } from '../../routes';
import { useAuth } from '../../stores/auth-context';
import { pageStyles } from './dashboard-placeholder-page.styles';

// Stands in for the real role-based dashboards (STORY-048/049/...) — STORY-004
// only needs a real navigation target to prove a successful login routes away
// from the login screen. The User Management link (STORY-007) is the one
// real piece of navigation an Event Manager has today.
const DashboardPlaceholderPage = () => {
  const { user } = useAuth();
  const greeting = user ? `Welcome, ${user.name}` : 'Welcome';
  const subtitle = user
    ? `The ${user.role} dashboard isn't built yet — this is a placeholder.`
    : 'Dashboard placeholder.';

  return (
    <Box sx={pageStyles}>
      <Typography variant="titleL" component="h1">
        {greeting}
      </Typography>
      <Typography variant="bodyM">{subtitle}</Typography>
      {user?.role === Role.EventManager && (
        <Typography variant="bodyM">
          <Link component={RouterLink} to={USER_MANAGEMENT_PATH}>
            User Management
          </Link>
        </Typography>
      )}
      {user?.role === Role.EventManager && (
        <Typography variant="bodyM">
          <Link component={RouterLink} to={EVENT_CREATE_PATH}>
            New Event
          </Link>
        </Typography>
      )}
    </Box>
  );
};

export default DashboardPlaceholderPage;
