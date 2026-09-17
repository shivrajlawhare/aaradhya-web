import type { ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { EVENT_LIST_PATH } from '../../routes';
import { EventWizardProvider, useEventWizard } from '../../stores/event-wizard-context';
import { contentStyles, headerRowStyles, shellStyles } from './event-wizard-shell.styles';
import WizardFooter from './wizard-footer';
import WizardStepper from './wizard-stepper';
import type { WizardStepId } from './wizard-steps';

interface EventWizardShellProps {
  step: WizardStepId;
  children: ReactNode;
  nextDisabled?: boolean;
  onNext?: () => void;
}

// Split from EventWizardShell below so useEventWizard() (Cancel's own
// clearWizard call) has a EventWizardProvider ancestor to read — the outer
// component's job is only to mount that Provider.
const ShellContent = ({ step, children, nextDisabled, onNext }: EventWizardShellProps) => {
  const navigate = useNavigate();
  const { clearWizard } = useEventWizard();

  // The AC's "explicit cancel" clearing trigger — a confirm() gate since
  // this discards real, already-entered data, same "confirm before a
  // destructive UI action" instinct used elsewhere in this app (though no
  // other screen has needed a literal browser confirm() before this one).
  const handleCancel = () => {
    if (window.confirm('Discard this new Event and start over?')) {
      clearWizard();
      navigate(EVENT_LIST_PATH);
    }
  };

  return (
    <Box sx={shellStyles}>
      <Box sx={headerRowStyles}>
        <Typography variant="titleL" component="h1">
          New Event
        </Typography>
        <Button variant="text" onClick={handleCancel}>
          Cancel
        </Button>
      </Box>
      <WizardStepper currentStep={step} />
      <Box sx={contentStyles}>{children}</Box>
      <WizardFooter currentStep={step} nextDisabled={nextDisabled} onNext={onNext} />
    </Box>
  );
};

// The wizard shell every one of the 5 step routes (app.tsx) wraps its own
// content in: header + Cancel, the Stepper, the step's own content, and the
// Next/Back footer — this story's own AC, "replacing whatever single-page
// event-creation-form.tsx currently does." Mounts a fresh EventWizardProvider
// per step route (see event-wizard-context.tsx's own comment for why that's
// fine) rather than assuming one already exists higher up the tree.
const EventWizardShell = ({ step, children, nextDisabled, onNext }: EventWizardShellProps) => (
  <EventWizardProvider>
    <ShellContent step={step} nextDisabled={nextDisabled} onNext={onNext}>
      {children}
    </ShellContent>
  </EventWizardProvider>
);

export default EventWizardShell;
