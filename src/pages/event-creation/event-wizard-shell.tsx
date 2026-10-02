import { type ReactNode, useState } from 'react';
import BoltIcon from '@mui/icons-material/Bolt';
import { Alert, Box, Button, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/page-header';
import { EVENT_LIST_PATH } from '../../routes';
import { EventWizardProvider, useEventWizard, type WizardData } from '../../stores/event-wizard-context';
import { contentStyles, headerActionsStyles, shellStyles } from './event-wizard-shell.styles';
import OneDayEventDialog from './one-day-event-dialog';
import { hasEnteredWizardData } from './one-day-event-prefill';
import WizardFooter from './wizard-footer';
import { isWizardStepReady } from './wizard-step-readiness';
import WizardStepper from './wizard-stepper';
import { WIZARD_STEPS, type WizardStepId } from './wizard-steps';

const ONE_DAY_EVENT_APPLIED_MESSAGE = 'One Day Event template applied — review each step and change anything you need.';

// Router state the One Day Event prefill navigates to step 1 with, so the
// Success Alert shows once on arrival (5B.3).
interface OneDayEventAppliedState {
  oneDayEventApplied: true;
}

const isOneDayEventAppliedState = (state: unknown): state is OneDayEventAppliedState =>
  typeof state === 'object' && state !== null && 'oneDayEventApplied' in state && state.oneDayEventApplied === true;

interface EventWizardShellProps {
  step: WizardStepId;
  children: ReactNode;
  // Only Step 5 (STORY-068) needs this — see wizard-footer.tsx's own
  // comment.
  onNext?: () => void;
}

// Split from EventWizardShell below so useEventWizard() (Cancel's own
// clearWizard call, and Next's own readiness check) has a
// EventWizardProvider ancestor to read — the outer component's job is only
// to mount that Provider.
const ShellContent = ({ step, children, onNext }: EventWizardShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { data, clearWizard, replaceWizard } = useEventWizard();
  const [isOneDayDialogOpen, setIsOneDayDialogOpen] = useState(false);
  // Bumped by each One Day Event prefill to remount the current step — see
  // handleApplyOneDayEvent.
  const [prefillCount, setPrefillCount] = useState(0);
  // Computed from whatever the current step already wrote into the wizard
  // store (wizard-step-readiness.ts) — not a prop threaded down from
  // app.tsx, so a future step story only ever touches its own step
  // component plus its own entry in that registry.
  const nextDisabled = !isWizardStepReady(step, data[step]);
  const isNextLoading = data[step]?.isSubmitting === true;
  const isOneDayEventApplied = step === 'client-details' && isOneDayEventAppliedState(location.state);

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

  // DEV-11 (D1): the template fills every step, then the user lands on
  // step 1 to enter the client's contacts. The step on screen is remounted
  // in the same render as the replace (prefillCount keys it), so it reads
  // the new data — even when that's step 1 itself — and can't write its own
  // stale state back over it while the navigation (a transition) is still
  // pending.
  const handleApplyOneDayEvent = (prefilled: WizardData) => {
    replaceWizard(prefilled);
    setPrefillCount((count) => count + 1);
    setIsOneDayDialogOpen(false);
    const appliedState: OneDayEventAppliedState = { oneDayEventApplied: true };
    navigate(WIZARD_STEPS[0]?.path ?? EVENT_LIST_PATH, { state: appliedState });
  };

  let oneDayButtonSize: 'medium' | 'small' = 'small';
  if (isDesktop) {
    oneDayButtonSize = 'medium';
  }

  return (
    <Box sx={shellStyles}>
      <PageHeader
        eyebrow="Create"
        title="New Event"
        isMobileDecorHidden
        actions={
          <Box sx={headerActionsStyles}>
            <Button
              variant="outlined"
              size={oneDayButtonSize}
              startIcon={<BoltIcon />}
              onClick={() => setIsOneDayDialogOpen(true)}
            >
              One Day Event
            </Button>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </Box>
        }
      />
      <WizardStepper currentStep={step} />
      {isOneDayEventApplied && (
        <Alert severity="success">
          <Typography variant="bodyM">{ONE_DAY_EVENT_APPLIED_MESSAGE}</Typography>
        </Alert>
      )}
      <Box key={prefillCount} sx={contentStyles}>
        {children}
      </Box>
      <WizardFooter currentStep={step} nextDisabled={nextDisabled} isNextLoading={isNextLoading} onNext={onNext} />
      {isOneDayDialogOpen && (
        <OneDayEventDialog
          isReplacing={hasEnteredWizardData(data)}
          onClose={() => setIsOneDayDialogOpen(false)}
          onApply={handleApplyOneDayEvent}
        />
      )}
    </Box>
  );
};

// The wizard shell every one of the 5 step routes (app.tsx) wraps its own
// content in: header (One Day Event + Cancel), the Stepper, the step's own
// content, and the Next/Back footer — this story's own AC, "replacing
// whatever single-page event-creation-form.tsx currently does." Mounts a
// fresh EventWizardProvider per step route (see event-wizard-context.tsx's
// own comment for why that's fine) rather than assuming one already exists
// higher up the tree.
const EventWizardShell = ({ step, children, onNext }: EventWizardShellProps) => (
  <EventWizardProvider>
    <ShellContent step={step} onNext={onNext}>
      {children}
    </ShellContent>
  </EventWizardProvider>
);

export default EventWizardShell;
