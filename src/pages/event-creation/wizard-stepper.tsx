import { Fragment, type ReactNode } from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import StepLabel from './step-label';
import {
  connectorStyles,
  desktopRowStyles,
  markerStyles,
  mobileLabelStyles,
  mobileWrapperStyles,
  segmentRowStyles,
  segmentStyles,
  type StepStatus,
  stepStyles,
} from './wizard-stepper.styles';
import { WIZARD_STEPS, type WizardStepId, wizardStepIndex } from './wizard-steps';

interface WizardStepperProps {
  currentStep: WizardStepId;
}

const getStepStatus = (index: number, currentIndex: number): StepStatus => {
  if (index === currentIndex) {
    return 'current';
  }
  if (index < currentIndex) {
    return 'completed';
  }
  return 'upcoming';
};

// Five numbered steps on desktop, condensing on mobile to "Step N of 5 —
// <Name>" plus a segmented progress bar — five steps don't fit at 390px.
// "Completed" is purely positional (index < current): deep-linking is
// allowed with no forced replay, so there's no per-step validation state to
// call "completed" instead. The stepper is not clickable (UI-09).
const WizardStepper = ({ currentStep }: WizardStepperProps) => {
  const theme = useTheme();
  // 900px — MUI's own `md` breakpoint, matching every other responsive
  // screen in this app.
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const currentIndex = wizardStepIndex(currentStep);

  if (!isDesktop) {
    const current = WIZARD_STEPS[currentIndex];
    const progress = ((currentIndex + 1) / WIZARD_STEPS.length) * 100;
    return (
      <Box sx={mobileWrapperStyles}>
        <Typography variant="labelM" sx={mobileLabelStyles}>
          Step {currentIndex + 1} of {WIZARD_STEPS.length} — {current?.label}
        </Typography>
        <Box
          role="progressbar"
          aria-label="Wizard progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          sx={segmentRowStyles}
        >
          {WIZARD_STEPS.map((step, index) => (
            <Box key={step.id} sx={segmentStyles(index <= currentIndex)} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box component="nav" aria-label="Wizard steps" sx={desktopRowStyles}>
      {WIZARD_STEPS.map((step, index) => {
        const status = getStepStatus(index, currentIndex);
        let marker: ReactNode = index + 1;
        let ariaCurrent: 'step' | undefined;
        if (status === 'completed') {
          marker = <CheckRoundedIcon aria-hidden />;
        }
        if (status === 'current') {
          ariaCurrent = 'step';
        }
        return (
          <Fragment key={step.id}>
            {index > 0 && <Box aria-hidden sx={connectorStyles(index <= currentIndex)} />}
            <Box sx={stepStyles} data-status={status} aria-current={ariaCurrent}>
              <Box aria-hidden sx={markerStyles(status)}>
                {marker}
              </Box>
              <StepLabel number={index + 1} label={step.label} status={status} />
            </Box>
          </Fragment>
        );
      })}
    </Box>
  );
};

export default WizardStepper;
