import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { mockMatchMedia } from './match-media';

// jsdom doesn't implement matchMedia — MUI's useMediaQuery (AppShell's own
// desktop/mobile breakpoint check) throws without it. Default to "no
// match" so any test that renders AppShell without opting into a specific
// viewport still gets a real (mobile) branch instead of a crash; tests
// about AppShell's own responsive behavior call mockMatchMedia again to
// pick the branch they're exercising.
mockMatchMedia(false);

afterEach(() => {
  cleanup();
});
