import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button, Stack } from '@mui/material';
import { Role } from '../../contract';
import { CALENDAR_PATH, EVENT_CREATE_PATH, EVENT_LIST_PATH, LOGIN_PATH, USER_MANAGEMENT_PATH } from '../../routes';
import { useAuth } from '../../stores/auth-context';
import { navRowStyles } from './dashboard-nav.styles';

// The one place every role reaches the rest of the app from. Restores (as
// real buttons, not the plain text links it used) navigation the old
// DashboardPlaceholderPage carried before STORY-048 replaced it with the
// real dashboard — that story's own AC never mentioned navigation, so
// nothing carried the placeholder's own Events/Calendar/User Management/
// New Event links forward, and no later story added them back. GET
// /events (STORY-013) and GET /calendar (STORY-034) both have no role
// restriction, so every role gets those two; New Event/User Management
// stay Event-Manager-only, matching EVENT_CREATE_PATH/USER_MANAGEMENT_PATH's
// own RequireRole gates in app.tsx. Logout has never had a UI entry point
// anywhere in this app despite AuthContext's own `logout` existing since
// STORY-004 — added here for the same reason.
const DashboardNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(LOGIN_PATH, { replace: true });
  };

  return (
    <Stack direction="row" sx={navRowStyles}>
      <Button component={RouterLink} to={EVENT_LIST_PATH}>
        Events
      </Button>
      <Button component={RouterLink} to={CALENDAR_PATH}>
        Calendar
      </Button>
      {user?.role === Role.EventManager && (
        <Button component={RouterLink} to={EVENT_CREATE_PATH} variant="contained">
          New Event
        </Button>
      )}
      {user?.role === Role.EventManager && (
        <Button component={RouterLink} to={USER_MANAGEMENT_PATH}>
          User Management
        </Button>
      )}
      <Button onClick={handleLogout}>Logout</Button>
    </Stack>
  );
};

export default DashboardNav;
