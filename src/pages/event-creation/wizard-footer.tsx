import type { ReactNode } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Box, Button, IconButton, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { footerStyles, mobileBackStyles, spacerStyles } from './wizard-footer.styles';
import { WIZARD_STEPS, type WizardStepId, wizardStepIndex } from './wizard-steps';

interface WizardFooterProps {
  currentStep: WizardStepId;
  // Each step's own readiness (wizard-step-readiness.ts); Next stays
  // enabled when omitted.
  nextDisabled?: boolean;
  // Step 5's "Generating" state: Next shows a spinner while the Event is
  // being created (Figma 5 Review — Generating).
  isNextLoading?: boolean;
  // Only Step 5 (STORY-068) needs this — "Generate Quotation" submits
  // instead of navigating to a step 6 that doesn't exist. Every other step
  // falls back to the default: navigate to the next step's path.
  onNext?: () => void;
}

// "Next"/"Back" on every step: Step 1 has no Back; Step 5's Next reads
// "Generate Quotation" instead of "Next: <label> →". Back is a plain
// navigate() — it never touches wizard state, so "Back never discards
// already-entered data on the step being left" holds by construction.
const WizardFooter = ({ currentStep, nextDisabled = false, isNextLoading = false, onNext }: WizardFooterProps) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
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

  let nextSize: 'medium' | 'large' = 'large';
  if (isDesktop) {
    nextSize = 'medium';
  }

  let backControl: ReactNode = null;
  if (previousStep && isDesktop) {
    backControl = (
      <Button variant="outlined" onClick={() => navigate(previousStep.path)}>
        ← Back
      </Button>
    );
  } else if (previousStep) {
    backControl = (
      <IconButton aria-label="Back" onClick={() => navigate(previousStep.path)} sx={mobileBackStyles}>
        <ArrowBackRoundedIcon />
      </IconButton>
    );
  }

  return (
    <Box sx={footerStyles}>
      {backControl}
      {isDesktop && <Box sx={spacerStyles} />}
      <Button
        variant="contained"
        size={nextSize}
        fullWidth={!isDesktop}
        onClick={handleNext}
        disabled={nextDisabled}
        loading={isNextLoading}
      >
        {nextLabel}
      </Button>
    </Box>
  );
};

export default WizardFooter;
