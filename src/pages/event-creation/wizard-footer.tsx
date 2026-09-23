import { Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { footerStyles } from './wizard-footer.styles';
import { WIZARD_STEPS, type WizardStepId, wizardStepIndex } from './wizard-steps';

interface WizardFooterProps {
  currentStep: WizardStepId;
  // Undefined (the default) for every shell-only step this story ships —
  // there's no real per-step validation yet, so Next always enables. A
  // future step story (STORY-064 through 067) passes its own computed
  // boolean once it has real fields to validate (this story's own AC:
  // "each step's own validation still applies before its own 'Next'
  // enables").
  nextDisabled?: boolean;
  // Only Step 5 (STORY-068) needs this — "Generate Quotation" submits
  // instead of navigating to a step 6 that doesn't exist. Every other step
  // falls back to the default: navigate to the next step's path.
  onNext?: () => void;
}

// "Next"/"Back" on every step (this story's own AC): Step 1 has no Back;
// Step 5's Next reads "Generate Quotation" instead of "Next: <label> →".
// Back is a plain navigate() — it never touches wizard state (setStepData
// lives on each step's own future content, not here), so "Back never
// discards already-entered data on the step being left" holds by
// construction, not by any explicit safeguard this component adds.
const WizardFooter = ({ currentStep, nextDisabled = false, onNext }: WizardFooterProps) => {
  const navigate = useNavigate();
  const index = wizardStepIndex(currentStep);
  const isLastStep = index === WIZARD_STEPS.length - 1;
  const previousStep = WIZARD_STEPS[index - 1];
  const nextStep = WIZARD_STEPS[index + 1];

  const nextLabel = isLastStep ? 'Generate Quotation' : `Next: ${nextStep?.label} →`;

  const handleNext = () => {
    if (onNext) {
      onNext();
      return;
    }
    if (nextStep) {
      navigate(nextStep.path);
    }
  };

  return (
    <Box sx={footerStyles}>
      {previousStep && (
        <Button variant="outlined" onClick={() => navigate(previousStep.path)}>
          ← Back
        </Button>
      )}
      <Button variant="contained" onClick={handleNext} disabled={nextDisabled}>
        {nextLabel}
      </Button>
    </Box>
  );
};

export default WizardFooter;
