import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTO_DISMISS_MS, ToastProvider, useToast } from '../../src/components/ui/toast-provider';
import { EXIT_DURATION_MS } from '../../src/components/ui/toast-provider.styles';
import AppThemeProvider from '../../src/theme/app-theme-provider';
import { emittedRuleFor } from '../support/emitted-css';

const Trigger = () => {
  const { showSuccess, showError } = useToast();
  return (
    <>
      <button onClick={() => showSuccess('Event created.')}>success</button>
      <button onClick={() => showError('Something went wrong.')}>error</button>
    </>
  );
};

const renderToasts = () =>
  render(
    <AppThemeProvider>
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    </AppThemeProvider>
  );

const alertFor = (message: string) => {
  const alert = screen.getByText(message).closest('.MuiAlert-root');
  if (!alert) {
    throw new Error(`expected an Alert for "${message}"`);
  }
  return alert;
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastProvider', () => {
  it('shows success and error toasts stacked, inside a polite live region', () => {
    renderToasts();

    fireEvent.click(screen.getByRole('button', { name: 'success' }));
    fireEvent.click(screen.getByRole('button', { name: 'error' }));

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('Event created.');
    expect(region).toHaveTextContent('Something went wrong.');
  });

  it('auto-hides a toast after 2500 ms plus its exit animation', () => {
    renderToasts();
    fireEvent.click(screen.getByRole('button', { name: 'success' }));

    act(() => {
      vi.advanceTimersByTime(AUTO_DISMISS_MS - 1);
    });
    expect(screen.getByText('Event created.')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1 + EXIT_DURATION_MS);
    });
    expect(screen.queryByText('Event created.')).not.toBeInTheDocument();
  });

  it('closes a toast from its × button', () => {
    renderToasts();
    fireEvent.click(screen.getByRole('button', { name: 'success' }));

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    act(() => {
      vi.advanceTimersByTime(EXIT_DURATION_MS);
    });

    expect(screen.queryByText('Event created.')).not.toBeInTheDocument();
  });

  it('draws every toast on the inverse surface with a severity-coloured accent bar', () => {
    renderToasts();
    fireEvent.click(screen.getByRole('button', { name: 'success' }));
    fireEvent.click(screen.getByRole('button', { name: 'error' }));

    const successRule = emittedRuleFor(alertFor('Event created.'));
    const errorRule = emittedRuleFor(alertFor('Something went wrong.'));
    expect(successRule).toContain('background-color:var(--mui-palette-brand-inverse)');
    expect(successRule).toContain('color:var(--mui-palette-brand-onInverse)');
    expect(errorRule).toContain('background-color:var(--mui-palette-brand-inverse)');
    expect(document.head.textContent).toContain('background-color:var(--mui-palette-success-main)');
    expect(document.head.textContent).toContain('background-color:var(--mui-palette-error-main)');
  });
});
