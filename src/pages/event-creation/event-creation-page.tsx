import { Box } from '@mui/material';
import EventCreationForm from './event-creation-form';
import { pageStyles } from './event-creation-page.styles';

const EventCreationPage = () => {
  return (
    <Box sx={pageStyles}>
      <EventCreationForm />
    </Box>
  );
};

export default EventCreationPage;
