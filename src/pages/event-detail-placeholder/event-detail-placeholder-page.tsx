import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { pageStyles } from './event-detail-placeholder-page.styles';

// Stands in for the real Event Detail screen (STORY-017) — STORY-015 only
// needs a real navigation target to prove a successful Event creation routes
// away from the creation form, the same role DashboardPlaceholderPage played
// for STORY-004's login flow.
const EventDetailPlaceholderPage = () => {
  const { id } = useParams();

  return (
    <Box sx={pageStyles}>
      <Typography variant="titleL" component="h1">
        Event {id}
      </Typography>
      <Typography variant="bodyM">The Event Detail screen isn't built yet — this is a placeholder.</Typography>
    </Box>
  );
};

export default EventDetailPlaceholderPage;
