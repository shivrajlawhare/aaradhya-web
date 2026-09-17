import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { WizardStepId } from '../pages/event-creation/wizard-steps';

// Arbitrary, step-owned JSON — each step's own future story (STORY-064
// through STORY-068) defines and reads/writes its own shape here; this
// shell only needs to move opaque blobs around and persist them, not know
// what's inside any one of them.
export type WizardStepData = Record<string, unknown>;

type WizardData = Partial<Record<WizardStepId, WizardStepData>>;

interface WizardContextValue {
  data: WizardData;
  setStepData: (step: WizardStepId, stepData: WizardStepData) => void;
  // Cleared on successful submission (STORY-068) or an explicit Cancel
  // (event-wizard-shell.tsx) — this story's own AC; never called by mere
  // Back/Next navigation, which is what keeps "Back never discards
  // already-entered data" true by construction.
  clearWizard: () => void;
}

// sessionStorage, not localStorage (unlike auth-context.tsx's own session
// token) — a wizard in progress is deliberately scoped to the current
// tab/browser session, not carried indefinitely across restarts the way a
// login is.
export const WIZARD_STORAGE_KEY = 'aaradhya.event-wizard';

const readStoredWizard = (): WizardData => {
  try {
    const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as WizardData) : {};
  } catch {
    return {};
  }
};

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

interface EventWizardProviderProps {
  children: ReactNode;
}

// One instance's worth of state for the whole New Event wizard (STORY-063).
// Re-read fresh from sessionStorage on every mount (same initializer
// pattern auth-context.tsx already uses for its own stored session) rather
// than kept in one long-lived Provider instance — each of the 5 step routes
// (app.tsx) mounts its own EventWizardShell/Provider, since this app has no
// existing nested-route/Outlet precedent to share one Provider instance
// across sibling routes. Writing synchronously to sessionStorage on every
// setStepData call is what makes that remount-per-navigation invisible: the
// next mount just reads back what the previous one wrote, and a real page
// reload (this story's own AC) works through the exact same path.
export const EventWizardProvider = ({ children }: EventWizardProviderProps) => {
  const [data, setData] = useState<WizardData>(readStoredWizard);

  const value = useMemo<WizardContextValue>(
    () => ({
      data,
      setStepData: (step, stepData) => {
        setData((current) => {
          const next = { ...current, [step]: stepData };
          sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      },
      clearWizard: () => {
        sessionStorage.removeItem(WIZARD_STORAGE_KEY);
        setData({});
      },
    }),
    [data],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
};

export const useEventWizard = (): WizardContextValue => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useEventWizard must be used within an EventWizardProvider');
  }
  return context;
};
