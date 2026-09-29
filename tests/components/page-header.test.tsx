import { Button } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PageHeader from '../../src/components/ui/page-header';
import AppThemeProvider from '../../src/theme/app-theme-provider';
import { emittedCss, emittedRule } from '../support/emitted-css';

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

  it('swaps the desktop decor for the compact mobile cluster, hidden from assistive tech', () => {
    renderHeader();

    const decorFrame = (layout: 'desktop' | 'mobile') => {
      const frame = document.querySelector(`[data-decor="${layout}"]`);
      if (!frame) {
        throw new Error(`expected the ${layout} decor frame`);
      }
      return frame;
    };

    const desktop = decorFrame('desktop');
    const mobile = decorFrame('mobile');
    expect(desktop).toHaveAttribute('aria-hidden', 'true');
    expect(mobile).toHaveAttribute('aria-hidden', 'true');
    expect(desktop.querySelectorAll('img')).toHaveLength(2);
    expect(emittedCss()).toContain(`@media (min-width:0px){.${cssClassOf(desktop)}{display:none;}}`);
    // Emitted with vendor-prefixed display values ahead of `display:flex`.
    expect(emittedRule(`@media (min-width:900px){.${cssClassOf(desktop)}`)).toContain('display:flex;');
    expect(emittedCss()).toContain(`@media (min-width:900px){.${cssClassOf(mobile)}{display:none;}}`);
  });

  it('can leave the title to the app shell top bar on mobile', () => {
    renderHeader({ isTitleHiddenOnMobile: true });

    const title = screen.getByRole('heading', { level: 1, name: 'Dashboard' });
    expect(emittedCss()).toContain(`@media (min-width:0px){.${cssClassOf(title)}{display:none;}}`);
    expect(emittedCss()).toContain(`@media (min-width:900px){.${cssClassOf(title)}{display:block;}}`);
  });
});

const cssClassOf = (element: Element) => Array.from(element.classList).find((name) => name.startsWith('css-'));
