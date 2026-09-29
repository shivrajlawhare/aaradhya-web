import { Button } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PageHeader from '../../src/components/ui/page-header';
import AppThemeProvider from '../../src/theme/app-theme-provider';
import { emittedCss } from '../support/emitted-css';

const renderHeader = (props: Partial<Parameters<typeof PageHeader>[0]> = {}) =>
  render(
    <AppThemeProvider>
      <PageHeader eyebrow="Overview" title="Dashboard" {...props} />
    </AppThemeProvider>
  );

describe('PageHeader', () => {
  it('renders the caller’s eyebrow and the title as the page h1', () => {
    renderHeader();

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders optional supporting text and actions only when given', () => {
    const { unmount } = renderHeader();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Good evening, Priya')).not.toBeInTheDocument();
    unmount();

    renderHeader({ supportingText: 'Good evening, Priya', actions: <Button>New Event</Button> });
    expect(screen.getByText('Good evening, Priya')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Event' })).toBeInTheDocument();
  });

  it('shows the decoration on desktop only and hides it from assistive tech', () => {
    renderHeader();

    const decor = screen.getByRole('banner').querySelector(':scope > [aria-hidden="true"]');
    if (!decor) {
      throw new Error('expected the decor frame');
    }
    expect(decor).toHaveAttribute('aria-hidden', 'true');
    expect(decor.querySelector('img')).toHaveAttribute('alt', '');
    const decorClass = Array.from(decor.classList).find((name) => name.startsWith('css-'));
    expect(emittedCss()).toContain(`@media (min-width:0px){.${decorClass}{display:none;}}`);
    expect(emittedCss()).toContain(`@media (min-width:900px){.${decorClass}{display:block;}}`);
  });
});
