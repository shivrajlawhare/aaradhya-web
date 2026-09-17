import { Box, LinearProgress, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { WIZARD_STEPS, wizardStepIndex, type WizardStepId } from './wizard-steps';
import { desktopRowStyles, mobileLabelStyles, mobileWrapperStyles, pillStyles, progressBarStyles } from './wizard-stepper.styles';

interface WizardStepperProps {
  currentStep: WizardStepId;
}

// This story's own AC: five numbered pills on desktop (current filled
// accent, completed filled accent-tint/accent-deep text, remaining
// outlined-only), condensing on mobile to "Step N of 5 — <Name>" plus a
// thin progress bar — five pills don't fit at 390px. "Completed" is purely
// positional (index < current) — deep-linking is allowed with no forced
// replay (this story's own AC), so this shell has no per-step validation
// state to call "completed" instead; a future step story is free to make
// that distinction sharper once it has real validation to report.
const WizardStepper = ({ currentStep }: WizardStepperProps) => {
  const theme = useTheme();
  // 900px — MUI's own `md` breakpoint, matching every other responsive
  // screen in this app.
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const currentIndex = wizardStepIndex(currentStep);

  if (!isDesktop) {
    const current = WIZARD_STEPS[currentIndex];
    return (
      <Box sx={mobileWrapperStyles}>
        <Typography variant="labelS" sx={mobileLabelStyles}>
          Step {currentIndex + 1} of {WIZARD_STEPS.length} — {current?.label}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={((currentIndex + 1) / WIZARD_STEPS.length) * 100}
          sx={progressBarStyles}
          aria-label="Wizard progress"
        />
      </Box>
    );
  }

  return (
    <Stack direction="row" component="nav" aria-label="Wizard steps" sx={desktopRowStyles}>
      {WIZARD_STEPS.map((step, index) => {
        const status = index === currentIndex ? 'current' : index < currentIndex ? 'completed' : 'upcoming';
        return (
          <Box key={step.id} sx={pillStyles(status)} aria-current={status === 'current' ? 'step' : undefined}>
            <Typography variant="labelS">
              {index + 1}. {step.label}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
};

export default WizardStepper;
