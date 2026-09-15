import { vi } from 'vitest';

// jsdom has no real layout engine, so `matches` doesn't come from the query
// string's own min-width — it's just the fixed answer every query gets for
// the rest of the test, letting a test pick "desktop" (matches: true) or
// "mobile" (matches: false) for MUI's useMediaQuery(theme.breakpoints.up('md')).
export const mockMatchMedia = (matches: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};
