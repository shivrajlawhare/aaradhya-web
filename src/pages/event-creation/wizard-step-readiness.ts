import type { WizardStepData } from '../../stores/event-wizard-context';
import type { WizardStepId } from './wizard-steps';

// Each step's own "is Next allowed" predicate, read directly from whatever
// that step already wrote into the wizard store (event-wizard-shell.tsx
// calls this generically via the current step id) — this is what lets the
// shell compute Next's disabled state without any nextDisabled prop
// threaded through app.tsx's route registration, so a future step story
// only ever touches its own entry here plus its own step component, never
// the shell. A step with no entry here (every step STORY-066/067/068
// haven't replaced their own placeholder for yet) always enables, matching
// this shell's own "no real validation yet" default (STORY-063).
export const WIZARD_STEP_READY_CHECKS: Partial<Record<WizardStepId, (stepData: WizardStepData | undefined) => boolean>> = {
  // STORY-065's own AC: "requires at least one Session added."
  'event-details': (stepData) => {
    const sessions = stepData?.sessions;
    return Array.isArray(sessions) && sessions.length > 0;
  },
};

export const isWizardStepReady = (step: WizardStepId, stepData: WizardStepData | undefined): boolean => {
  const check = WIZARD_STEP_READY_CHECKS[step];
  return check ? check(stepData) : true;
};
