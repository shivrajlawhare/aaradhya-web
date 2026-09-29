import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ErrorState, { type ErrorStateLink } from '../../src/components/ui/error-state';
import { ILLUSTRATIONS } from '../../src/components/ui/illustrations';
import AppThemeProvider from '../../src/theme/app-theme-provider';

const renderErrorState = (link?: ErrorStateLink) =>
  render(
    <AppThemeProvider>
      <MemoryRouter>
        <ErrorState illustration="not-found" message="No Event with that id." link={link} />
      </MemoryRouter>
    </AppThemeProvider>
  );

describe('ErrorState', () => {
  it('renders the caller’s message with the named illustration', () => {
    renderErrorState();

    expect(screen.getByText('No Event with that id.')).toBeInTheDocument();
    expect(document.querySelector('img[data-scheme="light"]')).toHaveAttribute('src', ILLUSTRATIONS['not-found'].light);
    expect(document.querySelector('img[data-scheme="dark"]')).toHaveAttribute('src', ILLUSTRATIONS['not-found'].dark);
  });

  it('renders the optional link to the given route', () => {
    renderErrorState({ label: 'Back to Events', to: '/events' });

    expect(screen.getByRole('link', { name: 'Back to Events' })).toHaveAttribute('href', '/events');
  });

  it('renders no link when none is given', () => {
    renderErrorState();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
