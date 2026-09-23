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
export const WIZARD_STEP_READY_CHECKS: Partial<
  Record<WizardStepId, (stepData: WizardStepData | undefined) => boolean>
> = {
  // STORY-065's own AC: "requires at least one Session added."
  'event-details': (stepData) => {
    const sessions = stepData?.sessions;
    return Array.isArray(sessions) && sessions.length > 0;
  },
  // STORY-066's own AC: "requires Check-in and Check-out to be set" — Room
  // Lines may all be zero, so they're not part of this check. Also blocks
  // an invalid range (check-out before check-in), same "Next must not lead
  // to a nonsensical negative total_days" reasoning the step's own edge
  // case documents.
  accommodation: (stepData) => {
    const checkInDate = stepData?.checkInDate;
    const checkOutDate = stepData?.checkOutDate;
    if (typeof checkInDate !== 'string' || !checkInDate || typeof checkOutDate !== 'string' || !checkOutDate) {
      return false;
    }
    return checkOutDate >= checkInDate;
  },
  // STORY-067's own AC: "does not require anything further to be added...
  // but does require every date tab to have been visited at least once."
  // allDatesVisited is derived and written by the step component itself
  // (it alone can see Step 2's own distinct-dates list), not recomputed
  // here — this registry only ever reads a step's own stored data, the
  // same narrow contract every other entry above already keeps to.
  'sessions-items': (stepData) => stepData?.allDatesVisited === true,
  // STORY-068 — disables the shared footer's "Generate Quotation" button
  // while a submission is in flight (review-step.tsx mirrors its own
  // isSubmitting into the wizard store precisely so this registry, not a
  // prop threaded down from outside, can gate it) — otherwise a second
  // click during the async POST /events call could fire a duplicate
  // submission.
  review: (stepData) => stepData?.isSubmitting !== true,
};

export const isWizardStepReady = (step: WizardStepId, stepData: WizardStepData | undefined): boolean => {
  const check = WIZARD_STEP_READY_CHECKS[step];
  return check ? check(stepData) : true;
};
