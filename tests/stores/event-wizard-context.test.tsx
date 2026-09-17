import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  EventWizardProvider,
  WIZARD_STORAGE_KEY,
  useEventWizard,
} from '../../src/stores/event-wizard-context';

// A test-only harness exposing useEventWizard() through real DOM
// interactions (type, click) rather than reaching into the hook directly —
// no such interactive field exists in src/ yet (STORY-063 ships the shell
// only; STORY-064's own real Client Details fields will be the first real
// caller of setStepData).
const WizardStoreHarness = () => {
  const { data, setStepData, clearWizard } = useEventWizard();
  const clientDetails = data['client-details'];
  const notes = clientDetails && typeof clientDetails.notes === 'string' ? clientDetails.notes : '';

  return (
    <div>
      <input
        aria-label="notes"
        value={notes}
        onChange={(event) => setStepData('client-details', { notes: event.target.value })}
      />
      <button onClick={clearWizard}>Clear Wizard</button>
      <span>Stored: {notes}</span>
    </div>
  );
};

const renderHarness = () =>
  render(
    <EventWizardProvider>
      <WizardStoreHarness />
    </EventWizardProvider>,
  );

afterEach(() => {
  sessionStorage.clear();
});

describe('EventWizardProvider / useEventWizard', () => {
  it('starts empty when sessionStorage has nothing stored', () => {
    renderHarness();

    expect(screen.getByLabelText('notes')).toHaveValue('');
  });

  it('persists a setStepData write to sessionStorage synchronously', () => {
    renderHarness();

    fireEvent.change(screen.getByLabelText('notes'), { target: { value: 'Bride: Priya' } });

    expect(screen.getByText('Stored: Bride: Priya')).toBeInTheDocument();
    const stored = JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) ?? '{}');
    expect(stored['client-details']).toEqual({ notes: 'Bride: Priya' });
  });

  // This story's own AC: "a reload mid-wizard doesn't lose entered data."
  // jsdom has no real reload, so a fresh Provider mount (unmount + remount,
  // the same lifecycle a real reload puts every React tree through) is what
  // this asserts against.
  it('rehydrates previously-entered data on a fresh mount (simulated reload)', () => {
    const first = renderHarness();
    fireEvent.change(screen.getByLabelText('notes'), { target: { value: 'Groom: Rohan' } });
    first.unmount();

    renderHarness();

    expect(screen.getByLabelText('notes')).toHaveValue('Groom: Rohan');
  });

  it('clearWizard removes the sessionStorage key and resets in-memory data', () => {
    renderHarness();
    fireEvent.change(screen.getByLabelText('notes'), { target: { value: 'Groom: Rohan' } });
    expect(sessionStorage.getItem(WIZARD_STORAGE_KEY)).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Clear Wizard' }));

    expect(screen.getByLabelText('notes')).toHaveValue('');
    expect(sessionStorage.getItem(WIZARD_STORAGE_KEY)).toBeNull();
  });

  it('useEventWizard throws outside an EventWizardProvider', () => {
    const ThrowingComponent = () => {
      useEventWizard();
      return null;
    };

    expect(() => render(<ThrowingComponent />)).toThrow('useEventWizard must be used within an EventWizardProvider');
  });
});
