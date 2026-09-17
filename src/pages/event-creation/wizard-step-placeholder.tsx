import { Paper, Typography } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';
import { WIZARD_STEPS, type WizardStepId } from './wizard-steps';

const STEP_STORY: Record<WizardStepId, string> = {
  'client-details': 'STORY-064',
  'event-details': 'STORY-065',
  accommodation: 'STORY-066',
  'sessions-items': 'STORY-067',
  review: 'STORY-068',
};

interface WizardStepPlaceholderProps {
  step: WizardStepId;
}

// This story (STORY-063) ships only the wizard shell — stepper, routing,
// cross-step state, footer nav. Each step's own real fields land in its own
// dedicated story (STORY-064 through 068); until then, every route renders
// this so the shell is fully exercisable (deep-linking, Back/Next,
// persistence) without any real step content to build against yet.
const WizardStepPlaceholder = ({ step }: WizardStepPlaceholderProps) => {
  const config = WIZARD_STEPS.find((candidate) => candidate.id === step);

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${colorTokens.line}`,
        borderRadius: `${radiusTokens.radiusMd}px`,
        p: `${spaceTokens.space24}px`,
      }}
    >
      <Typography variant="titleM" component="h2">
        {config?.label}
      </Typography>
      <Typography variant="bodyM">This step's content lands in {STEP_STORY[step]}.</Typography>
    </Paper>
  );
};

export default WizardStepPlaceholder;
