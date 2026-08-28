import { Box, Typography } from '@mui/material';
import { useAuth } from '../../stores/auth-context';
import { pageStyles } from './dashboard-placeholder-page.styles';

// Stands in for the real role-based dashboards (STORY-048/049/...) — STORY-004
// only needs a real navigation target to prove a successful login routes away
// from the login screen.
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
    </Box>
  );
};

export default DashboardPlaceholderPage;
