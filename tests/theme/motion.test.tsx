import { Button, CssBaseline, Dialog, Skeleton, useTheme } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import PageTransition from '../../src/components/ui/page-transition';
import AppThemeProvider from '../../src/theme/app-theme-provider';
import { emittedCss, emittedRuleFor } from '../support/emitted-css';
import { mockMatchMedia } from '../support/match-media';

// Reads the active theme's transition settings into the DOM.
const TransitionProbe = () => {
  const theme = useTheme();
  return (
    <output aria-label="transitions">
      {JSON.stringify({
        enter: theme.transitions.duration.enteringScreen,
        exit: theme.transitions.duration.leavingScreen,
        css: theme.transitions.create('opacity'),
      })}
    </output>
  );
};

const readProbe = (): { enter: number; exit: number; css: string } =>
  JSON.parse(screen.getByRole('status', { name: 'transitions' }).textContent ?? '{}');

const renderRoute = () =>
  render(
    <AppThemeProvider>
      <MemoryRouter>
        <PageTransition>
          <p>Route content</p>
        </PageTransition>
      </MemoryRouter>
    </AppThemeProvider>
  );

const routeWrapper = () => screen.getByText('Route content').closest('[data-route-transition]');

afterEach(() => {
  mockMatchMedia(false);
  localStorage.clear();
});

describe('Motion (DEV-15, Figma Motion Spec)', () => {
  describe('with motion allowed', () => {
    it('uses motion/slow to enter and motion/base to exit dialogs, drawers and sheets', () => {
      mockMatchMedia(false);
      render(
        <AppThemeProvider>
          <TransitionProbe />
        </AppThemeProvider>
      );

      const probe = readProbe();
      expect(probe.enter).toBe(320);
      expect(probe.exit).toBe(220);
      expect(probe.css).toContain('opacity');
    });

    it('fades route content in and lifts it 8 px — opacity and transform only, so no layout shift', () => {
      mockMatchMedia(false);
      renderRoute();

      const rule = emittedRuleFor(routeWrapper());
      expect(rule).toMatch(/animation:\S+ 320ms cubic-bezier\(0\.4, 0, 0\.2, 1\)/);
      const keyframes = emittedCss().match(/@keyframes [^{]+\{from\{([^}]*)\}to\{([^}]*)\}/g) ?? [];
      const routeKeyframes = keyframes.find((frames) => frames.includes('translateY(8px)'));
      expect(routeKeyframes).toBeDefined();
      expect(routeKeyframes).not.toMatch(/margin|top:|height|width/);
    });

    it('presses buttons to scale 0.97 at motion/fast, and runs the skeleton wave at 1.6 s', () => {
      mockMatchMedia(false);
      render(
        <AppThemeProvider>
          <Button>Press me</Button>
          <Skeleton data-testid="skeleton" />
        </AppThemeProvider>
      );

      const buttonCss = emittedRuleFor(screen.getByRole('button', { name: 'Press me' }));
      expect(buttonCss).toContain('transform 120ms ease-out');
      expect(emittedCss()).toContain('transform:scale(0.97)');
      expect(emittedCss()).toMatch(
        /MuiSkeleton-root::after\{[^}]*;animation-duration:1\.6s;[^}]*;animation-timing-function:linear;/
      );
    });

    it('scales the dialog paper in at motion/slow', () => {
      mockMatchMedia(true);
      // matchMedia(true) answers every query, reduced motion included — so
      // this checks the static paper styling only.
      render(
        <AppThemeProvider>
          <Dialog open>
            <p>Dialog body</p>
          </Dialog>
        </AppThemeProvider>
      );

      expect(emittedRuleFor(screen.getByRole('dialog'))).toMatch(
        /;animation:\S+ 320ms cubic-bezier\(0\.4, 0, 0\.2, 1\)/
      );
      expect(emittedCss()).toMatch(
        /@keyframes \S+\{from\{[^}]*transform:scale\(0\.96\);\}to\{[^}]*transform:scale\(1\);\}\}/
      );
    });
  });

  describe('under prefers-reduced-motion (matchMedia mocked)', () => {
    it('makes every MUI transition instant', () => {
      mockMatchMedia(true);
      render(
        <AppThemeProvider>
          <TransitionProbe />
        </AppThemeProvider>
      );

      expect(readProbe()).toEqual({ enter: 0, exit: 0, css: 'none' });
    });

    it('shows route content without the page transition', () => {
      mockMatchMedia(true);
      renderRoute();

      expect(emittedRuleFor(routeWrapper())).toContain('animation:none');
    });

    it('keeps the global CSS kill-switch for every animation and transition', () => {
      mockMatchMedia(true);
      render(
        <AppThemeProvider>
          <CssBaseline />
        </AppThemeProvider>
      );

      expect(emittedCss()).toMatch(
        /@media \(prefers-reduced-motion: reduce\)\{\*,\s?\*::before,\s?\*::after\{[^}]*animation-duration:0\.01ms\s?!important;[^}]*transition-duration:0\.01ms\s?!important/
      );
    });
  });
});
