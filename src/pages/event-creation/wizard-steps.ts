import { eventCreateStepPath } from '../../routes';

export type WizardStepId = 'client-details' | 'event-details' | 'accommodation' | 'sessions-items' | 'review';

export interface WizardStepConfig {
  id: WizardStepId;
  label: string;
  path: string;
}

// Fixed order = the exact sequence the Quotation itself renders in (SRS
// §4.7's governing principle, this story's own Flow line): Client Details,
// Event Details, Accommodation, Sessions & Items, Review & Quotation — one
// entry per future STORY-064 through STORY-068, in that order. The one
// place this list is defined; the stepper, the footer, and app.tsx's route
// registration all read from here instead of each declaring their own copy.
export const WIZARD_STEPS: WizardStepConfig[] = [
  { id: 'client-details', label: 'Client Details', path: eventCreateStepPath('client-details') },
  { id: 'event-details', label: 'Event Details', path: eventCreateStepPath('event-details') },
  { id: 'accommodation', label: 'Accommodation', path: eventCreateStepPath('accommodation') },
  { id: 'sessions-items', label: 'Sessions & Items', path: eventCreateStepPath('sessions-items') },
  { id: 'review', label: 'Review & Quotation', path: eventCreateStepPath('review') },
];

export const wizardStepIndex = (id: WizardStepId): number => WIZARD_STEPS.findIndex((step) => step.id === id);
