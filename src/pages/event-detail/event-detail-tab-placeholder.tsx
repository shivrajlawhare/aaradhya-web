import { Paper, Typography } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

interface EventDetailTabPlaceholderProps {
  label: string;
  story: string;
}

// STORY-076 ships only the Event Detail tab shell (tab list, routing, role
// gates) for the two brand-new tabs this restructure introduces — Sessions &
// Items and Review & Quotation have no existing screen to relocate verbatim
// the way Client Details/Event Details/Accommodation do, so each renders this
// until its own dedicated story (STORY-079/STORY-080) replaces it. Mirrors
// wizard-step-placeholder.tsx's own identical role for the New Event wizard's
// not-yet-built steps.
const EventDetailTabPlaceholder = ({ label, story }: EventDetailTabPlaceholderProps) => (
  <Paper
    elevation={0}
    sx={{
      border: `1px solid ${colorTokens.line}`,
      borderRadius: `${radiusTokens.radiusMd}px`,
      p: `${spaceTokens.space24}px`,
    }}
  >
    <Typography variant="titleM" component="h2">
      {label}
    </Typography>
    <Typography variant="bodyM">This tab's content lands in {story}.</Typography>
  </Paper>
);

export default EventDetailTabPlaceholder;
