import type { ReactNode } from 'react';
import { Button } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EmptyState from '../../src/components/ui/empty-state';
import { ILLUSTRATIONS } from '../../src/components/ui/illustrations';
import AppThemeProvider from '../../src/theme/app-theme-provider';
import { emittedCss } from '../support/emitted-css';

const renderEmptyState = (action?: ReactNode) =>
  render(
    <AppThemeProvider>
      <EmptyState illustration="no-events-yet" title="No Events yet" action={action} />
    </AppThemeProvider>
  );

const schemeImage = (scheme: 'light' | 'dark') => {
  const image = document.querySelector(`img[data-scheme="${scheme}"]`);
  if (!image) {
    throw new Error(`expected a ${scheme} illustration`);
  }
  return image;
};

describe('EmptyState', () => {
  it('renders the caller’s title', () => {
    renderEmptyState();

    expect(screen.getByText('No Events yet')).toBeInTheDocument();
  });

  it('renders the named illustration for both colour schemes, decorative only', () => {
    renderEmptyState();

    expect(schemeImage('light')).toHaveAttribute('src', ILLUSTRATIONS['no-events-yet'].light);
    expect(schemeImage('dark')).toHaveAttribute('src', ILLUSTRATIONS['no-events-yet'].dark);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('swaps to the dark render under the dark colour scheme', () => {
    renderEmptyState();

    const darkClass = Array.from(schemeImage('dark').classList).find((name) => name.startsWith('css-'));
    expect(emittedCss()).toContain(`*:where([data-theme="dark"]) .${darkClass}{display:block;}`);
  });

  it('renders an optional action only when given', () => {
    const { unmount } = renderEmptyState();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    unmount();

    renderEmptyState(<Button>New Event</Button>);
    expect(screen.getByRole('button', { name: 'New Event' })).toBeInTheDocument();
  });
});
