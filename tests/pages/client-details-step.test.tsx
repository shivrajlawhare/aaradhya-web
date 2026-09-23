import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ClientDetailsStep from '../../src/pages/event-creation/client-details-step';
import EventWizardShell from '../../src/pages/event-creation/event-wizard-shell';
import WizardStepPlaceholder from '../../src/pages/event-creation/wizard-step-placeholder';
import { WIZARD_STEPS } from '../../src/pages/event-creation/wizard-steps';
import { WIZARD_STORAGE_KEY } from '../../src/stores/event-wizard-context';
import { theme } from '../../src/theme/theme';
import { mockMatchMedia } from '../support/match-media';

// Mirrors app.tsx's real wiring: ClientDetailsStep on the first route, the
// placeholder on the rest — close enough to exercise real Back/Next
// navigation carrying wizard-store data between steps.
const renderWizard = (initialPath: string) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path={WIZARD_STEPS[0]!.path}
            element={
              <EventWizardShell step="client-details">
                <ClientDetailsStep />
              </EventWizardShell>
            }
          />
          {WIZARD_STEPS.slice(1).map((step) => (
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
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

const clientDetailsPath = WIZARD_STEPS[0]!.path;
const eventDetailsPath = WIZARD_STEPS[1]!.path;

const readStoredContacts = (): Array<{
  id: string;
  roleLabel: string;
  isDefault: boolean;
  name: string;
  contactNumber: string;
}> => {
  const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
  const parsed = raw ? JSON.parse(raw) : {};
  return parsed['client-details']?.contacts ?? [];
};

beforeEach(() => {
  sessionStorage.clear();
  mockMatchMedia(true);
});

afterEach(() => {
  sessionStorage.clear();
});

describe('ClientDetailsStep', () => {
  it('renders three default rows pre-labeled Bride, Groom, Point of Contact', () => {
    renderWizard(clientDetailsPath);

    expect(screen.getByText('Bride')).toBeInTheDocument();
    expect(screen.getByText('Groom')).toBeInTheDocument();
    expect(screen.getByText('Point of Contact')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Name')).toHaveLength(3);
    expect(screen.getAllByLabelText('Contact Number')).toHaveLength(3);
  });

  it('default rows have no remove affordance', () => {
    renderWizard(clientDetailsPath);

    expect(screen.queryByRole('button', { name: /Remove contact row/ })).not.toBeInTheDocument();
  });

  it('both fields on a default row start empty and are not required', () => {
    renderWizard(clientDetailsPath);

    for (const field of screen.getAllByLabelText('Name')) {
      expect(field).toHaveValue('');
    }
    // "Next" always enables (this story's own AC) — no field on this step
    // blocks it, checked by not being disabled with nothing filled in.
    expect(screen.getByRole('button', { name: 'Next: Event Details →' })).toBeEnabled();
  });

  it('"Add Contact" appends a row with an editable free-text Role field and a remove button', () => {
    renderWizard(clientDetailsPath);

    fireEvent.click(screen.getByRole('button', { name: 'Add Contact' }));

    expect(screen.getAllByLabelText('Name')).toHaveLength(4);
    expect(screen.getByLabelText('Role')).toHaveValue('');
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'Family Friend' } });
    expect(screen.getByLabelText('Role')).toHaveValue('Family Friend');
    expect(screen.getByRole('button', { name: 'Remove contact row 4' })).toBeInTheDocument();
  });

  it('removing an added row drops it from the rendered list', () => {
    renderWizard(clientDetailsPath);
    fireEvent.click(screen.getByRole('button', { name: 'Add Contact' }));
    expect(screen.getAllByLabelText('Name')).toHaveLength(4);

    fireEvent.click(screen.getByRole('button', { name: 'Remove contact row 4' }));

    expect(screen.getAllByLabelText('Name')).toHaveLength(3);
    expect(screen.queryByLabelText('Role')).not.toBeInTheDocument();
  });

  it('typing into a default row persists into the wizard store', () => {
    renderWizard(clientDetailsPath);
    const nameFields = screen.getAllByLabelText('Name');

    fireEvent.change(nameFields[0]!, { target: { value: 'Priya Nair' } });

    const stored = readStoredContacts();
    expect(stored.find((row) => row.id === 'bride')?.name).toBe('Priya Nair');
  });

  // This story's own edge case: adding a row, filling it in, then removing
  // it must actually drop that row's data from the wizard store, not just
  // hide it — verified here against the store directly, standing in for
  // "Step 5's review" (STORY-068's own screen, not built yet).
  it('edge case: a removed row never reappears in the wizard store', () => {
    renderWizard(clientDetailsPath);
    fireEvent.click(screen.getByRole('button', { name: 'Add Contact' }));
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'Family Friend' } });
    fireEvent.change(screen.getAllByLabelText('Name')[3]!, { target: { value: 'Rohan Mehta' } });
    expect(readStoredContacts().some((row) => row.name === 'Rohan Mehta')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Remove contact row 4' }));

    expect(readStoredContacts().some((row) => row.name === 'Rohan Mehta')).toBe(false);
    expect(readStoredContacts()).toHaveLength(3);
  });

  it('carries entered contacts forward across Back/Next between Step 1 and Step 2', () => {
    renderWizard(clientDetailsPath);
    fireEvent.change(screen.getAllByLabelText('Name')[0]!, { target: { value: 'Priya Nair' } });

    fireEvent.click(screen.getByRole('button', { name: 'Next: Event Details →' }));
    expect(screen.getByText("This step's content lands in STORY-065.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '← Back' }));

    expect(screen.getAllByLabelText('Name')[0]).toHaveValue('Priya Nair');
  });
});
