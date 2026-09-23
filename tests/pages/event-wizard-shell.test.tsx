import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EventWizardShell from '../../src/pages/event-creation/event-wizard-shell';
import WizardStepPlaceholder from '../../src/pages/event-creation/wizard-step-placeholder';
import { WIZARD_STEPS } from '../../src/pages/event-creation/wizard-steps';
import { EVENT_LIST_PATH } from '../../src/routes';
import { WIZARD_STORAGE_KEY } from '../../src/stores/event-wizard-context';
import { theme } from '../../src/theme/theme';
import { mockMatchMedia } from '../support/match-media';

// Mirrors app.tsx's own wizard route registration (5 step routes, one
// WizardStepPlaceholder-backed EventWizardShell each) plus the Events list
// destination Cancel navigates to — close enough to exercise real
// navigation between wrapped steps without dragging in AppShell/RequireRole,
// which this story doesn't touch and are already covered elsewhere
// (app-shell.test.tsx, require-role.test.tsx).
const renderWizard = (initialPath: string) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          {WIZARD_STEPS.map((step) => (
            <Route
              key={step.id}
              path={step.path}
              element={
                <EventWizardShell step={step.id}>
                  <WizardStepPlaceholder step={step.id} />
                </EventWizardShell>
              }
            />
          ))}
          <Route path={EVENT_LIST_PATH} element={<div>events list placeholder</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

const clientDetailsPath = WIZARD_STEPS[0]!.path;
const eventDetailsPath = WIZARD_STEPS[1]!.path;
const accommodationPath = WIZARD_STEPS[2]!.path;
const sessionsItemsPath = WIZARD_STEPS[3]!.path;
const reviewPath = WIZARD_STEPS[4]!.path;

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe('EventWizardShell — desktop (>=900px) stepper', () => {
  it('renders all five pills, numbered and labeled in the fixed Quotation order', async () => {
    mockMatchMedia(true);
    renderWizard(accommodationPath);

    const nav = screen.getByRole('navigation', { name: 'Wizard steps' });
    expect(nav).toHaveTextContent('1. Client Details');
    expect(nav).toHaveTextContent('2. Event Details');
    expect(nav).toHaveTextContent('3. Accommodation');
    expect(nav).toHaveTextContent('4. Sessions & Items');
    expect(nav).toHaveTextContent('5. Review & Quotation');
  });

  it('marks only the current step aria-current="step"', () => {
    mockMatchMedia(true);
    renderWizard(accommodationPath);

    const current = screen.getByText('3. Accommodation').closest('[aria-current="step"]');
    expect(current).not.toBeNull();
    expect(screen.queryAllByText(/^\d\./).length).toBeGreaterThan(0);
    // Only one pill carries aria-current.
    const allCurrent = document.querySelectorAll('[aria-current="step"]');
    expect(allCurrent).toHaveLength(1);
  });

  it('fills completed steps accent-tint/accent-deep and leaves remaining steps outlined', () => {
    mockMatchMedia(true);
    renderWizard(accommodationPath);

    const completedPill = screen.getByText('1. Client Details').closest('div');
    const currentPill = screen.getByText('3. Accommodation').closest('div');
    const upcomingPill = screen.getByText('5. Review & Quotation').closest('div');

    expect(completedPill).toHaveStyle({ backgroundColor: '#FBE3D0', color: '#B84607' });
    expect(currentPill).toHaveStyle({ backgroundColor: '#E4630C' });
    // "Outlined only" (this story's own AC wording) — asserted via its
    // border color rather than its background, since jsdom's CSSOM
    // normalizes a literal `background-color: transparent` declaration
    // away from the string 'transparent' on read-back.
    expect(upcomingPill).toHaveStyle({ borderColor: '#E6DAC4' });
  });

  it('deep-links directly to a later step without forcing replay of earlier ones', () => {
    mockMatchMedia(true);
    renderWizard(sessionsItemsPath);

    expect(screen.getByText('Sessions & Items')).toBeInTheDocument();
    expect(screen.getByText("This step's content lands in STORY-067.")).toBeInTheDocument();
  });
});

describe('EventWizardShell — mobile (<900px) condensed stepper', () => {
  it('renders "Step N of 5 — <name>" and a progress bar instead of the five pills', () => {
    mockMatchMedia(false);
    renderWizard(eventDetailsPath);

    expect(screen.getByText('Step 2 of 5 — Event Details')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Wizard steps' })).not.toBeInTheDocument();
  });

  it('the progress bar value increases with step index', () => {
    mockMatchMedia(false);
    const { unmount } = renderWizard(clientDetailsPath);
    const firstValue = Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));
    unmount();

    renderWizard(reviewPath);
    const lastValue = Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));

    expect(lastValue).toBeGreaterThan(firstValue);
    expect(lastValue).toBe(100);
  });
});

describe('EventWizardShell — footer Back/Next', () => {
  it('Step 1 has no Back button', () => {
    mockMatchMedia(true);
    renderWizard(clientDetailsPath);

    expect(screen.queryByRole('button', { name: '← Back' })).not.toBeInTheDocument();
  });

  it('Steps 2-5 show a Back button that returns to the previous step', () => {
    mockMatchMedia(true);
    renderWizard(eventDetailsPath);

    fireEvent.click(screen.getByRole('button', { name: '← Back' }));

    expect(screen.getByText("This step's content lands in STORY-064.")).toBeInTheDocument();
  });

  it('labels Next "Next: <NextStep> →" on every step but the last', () => {
    mockMatchMedia(true);
    renderWizard(clientDetailsPath);
    expect(screen.getByRole('button', { name: 'Next: Event Details →' })).toBeInTheDocument();
  });

  it('labels the last step\'s Next button "Generate Quotation", not "Next: ... →"', () => {
    mockMatchMedia(true);
    renderWizard(reviewPath);

    expect(screen.getByRole('button', { name: 'Generate Quotation' })).toBeInTheDocument();
    expect(screen.queryByText(/^Next:/)).not.toBeInTheDocument();
  });

  it("clicking Next advances to the next step's route", () => {
    mockMatchMedia(true);
    renderWizard(clientDetailsPath);

    fireEvent.click(screen.getByRole('button', { name: 'Next: Event Details →' }));

    expect(screen.getByText("This step's content lands in STORY-065.")).toBeInTheDocument();
  });
});

describe('EventWizardShell — Cancel and data-preservation edge case', () => {
  it('Cancel prompts for confirmation, then clears sessionStorage and returns to the Events list', () => {
    mockMatchMedia(true);
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ 'client-details': { notes: 'typed' } }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWizard(clientDetailsPath);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(sessionStorage.getItem(WIZARD_STORAGE_KEY)).toBeNull();
    expect(screen.getByText('events list placeholder')).toBeInTheDocument();
  });

  it('declining the Cancel confirmation leaves the wizard step and its data untouched', () => {
    mockMatchMedia(true);
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ 'client-details': { notes: 'typed' } }));
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderWizard(clientDetailsPath);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(sessionStorage.getItem(WIZARD_STORAGE_KEY)).not.toBeNull();
    expect(screen.getByText('Client Details')).toBeInTheDocument();
  });

  // STORY-063's own edge case: navigating away mid-entry (here, ordinary
  // Back/Next between steps) must never discard already-entered data —
  // only an explicit Cancel (above) or a successful submit (STORY-068)
  // clears the store.
  it('normal Back navigation never touches previously-stored wizard data', () => {
    mockMatchMedia(true);
    const seeded = JSON.stringify({ 'client-details': { notes: 'Bride: Priya' } });
    sessionStorage.setItem(WIZARD_STORAGE_KEY, seeded);
    renderWizard(eventDetailsPath);

    fireEvent.click(screen.getByRole('button', { name: '← Back' }));

    expect(sessionStorage.getItem(WIZARD_STORAGE_KEY)).toBe(seeded);
  });
});

describe('EventWizardShell — resume after navigating away', () => {
  it('data entered before unmounting the wizard is still there on remount at the same step', () => {
    mockMatchMedia(true);
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ 'client-details': { notes: 'Bride: Priya' } }));
    const { unmount } = renderWizard(clientDetailsPath);
    unmount();

    renderWizard(clientDetailsPath);

    expect(sessionStorage.getItem(WIZARD_STORAGE_KEY)).toContain('Bride: Priya');
    expect(screen.getByText('Client Details')).toBeInTheDocument();
  });
});
