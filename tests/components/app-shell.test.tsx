import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import AppShell from '../../src/components/app-shell/app-shell';
import {
  CALENDAR_PATH,
  DASHBOARD_PATH,
  EVENT_CREATE_PATH,
  EVENT_DETAIL_PATH_PATTERN,
  EVENT_LIST_PATH,
  LOGIN_PATH,
  SETTINGS_PATH,
  USER_MANAGEMENT_PATH,
} from '../../src/routes';
import { AuthProvider, SESSION_STORAGE_KEY } from '../../src/stores/auth-context';
import AppThemeProvider from '../../src/theme/app-theme-provider';
import { THEME_MODE_STORAGE_KEY } from '../../src/theme/theme';
import { mockMatchMedia } from '../support/match-media';

const ROLE_NAV_ITEMS: [string, string, string[]][] = [
  ['EventManager', 'Event Manager', ['Dashboard', 'Events', 'Calendar', 'New Event', 'User Management', 'Settings']],
  ['FnBHead', 'F&B Head', ['Dashboard', 'Events', 'Calendar']],
  ['Housekeeping', 'Housekeeping', ['Dashboard', 'Events', 'Calendar']],
  ['Reception', 'Reception', ['Dashboard', 'Events', 'Calendar']],
];

const seedSession = (role = 'EventManager') => {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ token: 'signed-jwt', user: { id: 'user-1', name: 'Priya Nair', role } })
  );
};

// Mirrors app.tsx's own AppShell wiring closely enough to exercise real
// navigation between wrapped routes, without dragging in every real page
// component this story doesn't touch.
const renderShell = (initialPath: string) =>
  render(
    <AppThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route
              path={DASHBOARD_PATH}
              element={
                <AppShell title="Dashboard">
                  <div>dashboard content</div>
                </AppShell>
              }
            />
            <Route
              path={EVENT_LIST_PATH}
              element={
                <AppShell title="Events">
                  <div>events content</div>
                </AppShell>
              }
            />
            <Route
              path={EVENT_DETAIL_PATH_PATTERN}
              element={
                <AppShell>
                  <div>event detail content</div>
                </AppShell>
              }
            />
            <Route
              path={EVENT_CREATE_PATH}
              element={
                <AppShell>
                  <div>new event content</div>
                </AppShell>
              }
            />
            <Route
              path={USER_MANAGEMENT_PATH}
              element={
                <AppShell title="User Management">
                  <div>user management content</div>
                </AppShell>
              }
            />
            <Route
              path={CALENDAR_PATH}
              element={
                <AppShell title="Calendar">
                  <div>calendar content</div>
                </AppShell>
              }
            />
            <Route path={SETTINGS_PATH} element={<div>settings placeholder</div>} />
            <Route path={LOGIN_PATH} element={<div>login placeholder</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('AppShell', () => {
  describe('desktop rail (>=900px)', () => {
    it('shows Dashboard/Events/Calendar/Logout for a non-Event-Manager role, without New Event/User Management/Settings', () => {
      mockMatchMedia(true);
      seedSession('Reception');
      renderShell(DASHBOARD_PATH);

      const rail = screen.getByRole('navigation', { name: 'Primary' });
      expect(within(rail).getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
      expect(within(rail).getByRole('link', { name: 'Events' })).toBeInTheDocument();
      expect(within(rail).getByRole('link', { name: 'Calendar' })).toBeInTheDocument();
      expect(within(rail).getByRole('button', { name: 'Logout' })).toBeInTheDocument();
      expect(within(rail).queryByRole('link', { name: 'New Event' })).not.toBeInTheDocument();
      expect(within(rail).queryByRole('link', { name: 'User Management' })).not.toBeInTheDocument();
      expect(within(rail).queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
    });

    it("centers the screen's title over the content column (STORY-054)", () => {
      mockMatchMedia(true);
      seedSession('EventManager');
      renderShell(DASHBOARD_PATH);

      expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toHaveStyle({ textAlign: 'center' });
    });

    it('shows every row, including New Event/User Management/Settings, for an Event Manager', () => {
      mockMatchMedia(true);
      seedSession('EventManager');
      renderShell(DASHBOARD_PATH);

      const rail = screen.getByRole('navigation', { name: 'Primary' });
      expect(within(rail).getByRole('link', { name: 'New Event' })).toBeInTheDocument();
      expect(within(rail).getByRole('link', { name: 'User Management' })).toBeInTheDocument();
      expect(within(rail).getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    });

    it("marks the Events row selected while on an Event's own detail screen, not New Event", () => {
      mockMatchMedia(true);
      seedSession('EventManager');
      renderShell('/events/event-1');

      const rail = screen.getByRole('navigation', { name: 'Primary' });
      expect(within(rail).getByRole('link', { name: 'Events' })).toHaveAttribute('aria-current', 'page');
      expect(within(rail).getByRole('link', { name: 'New Event' })).not.toHaveAttribute('aria-current');
    });

    it('marks the New Event row selected, not Events, while on /events/new', () => {
      mockMatchMedia(true);
      seedSession('EventManager');
      renderShell(EVENT_CREATE_PATH);

      const rail = screen.getByRole('navigation', { name: 'Primary' });
      expect(within(rail).getByRole('link', { name: 'New Event' })).toHaveAttribute('aria-current', 'page');
      expect(within(rail).getByRole('link', { name: 'Events' })).not.toHaveAttribute('aria-current');
    });

    it('navigates via Link when a row is clicked, swapping the page content', () => {
      mockMatchMedia(true);
      seedSession('EventManager');
      renderShell(DASHBOARD_PATH);

      fireEvent.click(screen.getByRole('link', { name: 'Calendar' }));

      expect(screen.getByText('calendar content')).toBeInTheDocument();
    });

    it.each(ROLE_NAV_ITEMS)('shows %s exactly its nav items and a "%s" role chip', (role, roleLabel, expectedItems) => {
      mockMatchMedia(true);
      seedSession(role);
      renderShell(DASHBOARD_PATH);

      const rail = screen.getByRole('navigation', { name: 'Primary' });
      const items = within(within(rail).getByRole('navigation', { name: 'Main' })).getAllByRole('link');
      expect(items.map((item) => item.textContent)).toEqual(expectedItems);
      expect(within(rail).getByText('Priya Nair')).toBeInTheDocument();
      expect(within(rail).getByText(roleLabel)).toBeInTheDocument();
    });

    it('switches to dark with the theme toggle and keeps the choice after a reload', async () => {
      mockMatchMedia(true);
      seedSession('EventManager');
      const { unmount } = renderShell(DASHBOARD_PATH);

      const toggle = screen.getByRole('radiogroup', { name: 'Theme' });
      expect(within(toggle).getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');

      await userEvent.click(within(toggle).getByRole('radio', { name: 'Dark' }));

      expect(within(toggle).getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      expect(localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('dark');

      unmount();
      renderShell(DASHBOARD_PATH);

      expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
    });

    it('reaches every row, the theme toggle and Logout with Tab, in order', async () => {
      mockMatchMedia(true);
      seedSession('Reception');
      renderShell(DASHBOARD_PATH);

      const expectedOrder = [
        screen.getByRole('link', { name: 'Dashboard' }),
        screen.getByRole('link', { name: 'Events' }),
        screen.getByRole('link', { name: 'Calendar' }),
        screen.getByRole('radio', { name: 'Light' }),
        screen.getByRole('radio', { name: 'Dark' }),
        screen.getByRole('button', { name: 'Logout' }),
      ];
      for (const element of expectedOrder) {
        await userEvent.tab();
        expect(element).toHaveFocus();
      }
    });

    it('logs out and navigates to Login when Logout is clicked', () => {
      mockMatchMedia(true);
      seedSession('EventManager');
      renderShell(DASHBOARD_PATH);

      fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

      expect(screen.getByText('login placeholder')).toBeInTheDocument();
      expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });
  });

  describe('mobile top bar and full-screen nav (<900px)', () => {
    it('renders a hamburger and the screen title, with no persistent rail', () => {
      mockMatchMedia(false);
      seedSession('EventManager');
      renderShell(DASHBOARD_PATH);

      expect(screen.getByRole('button', { name: 'Open navigation' })).toBeInTheDocument();
      const title = screen.getByRole('heading', { name: 'Dashboard' });
      expect(title).toBeInTheDocument();
      // STORY-054's own AC: centered in the top bar, not left-aligned next
      // to the hamburger.
      expect(title).toHaveStyle({ textAlign: 'center' });
      expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument();
    });

    it('opens a full-screen nav with the same role-gated row set on hamburger tap', () => {
      mockMatchMedia(false);
      seedSession('Reception');
      renderShell(DASHBOARD_PATH);

      fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));

      const overlay = screen.getByRole('dialog', { name: 'Navigation' });
      expect(within(overlay).getByRole('link', { name: 'Events' })).toBeInTheDocument();
      expect(within(overlay).getByRole('button', { name: 'Logout' })).toBeInTheDocument();
      expect(within(overlay).queryByRole('link', { name: 'User Management' })).not.toBeInTheDocument();
    });

    it('closing the nav returns to the exact screen it was opened from, not Dashboard', async () => {
      mockMatchMedia(false);
      seedSession('EventManager');
      renderShell(EVENT_CREATE_PATH);

      expect(screen.getByText('new event content')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
      expect(screen.getByRole('dialog', { name: 'Navigation' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Close navigation' }));

      // The mobile nav is now a Slide transition (a real opening/closing
      // animation), not plain conditional JSX — it unmounts once its exit
      // transition finishes, not synchronously on click.
      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument());
      // Never unmounted, wizard state included — the overlay was drawn over
      // it, not routed over it.
      expect(screen.getByText('new event content')).toBeInTheDocument();
    });

    it('carries the user card, theme toggle and Logout in the overlay, and closes on Escape', async () => {
      mockMatchMedia(false);
      seedSession('FnBHead');
      renderShell(DASHBOARD_PATH);

      fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));

      const overlay = screen.getByRole('dialog', { name: 'Navigation' });
      expect(within(overlay).getByText('F&B Head')).toBeInTheDocument();
      expect(within(overlay).getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument();
      expect(within(overlay).getByRole('button', { name: 'Logout' })).toBeInTheDocument();

      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument());
    });

    it('closes the nav and navigates when a row is tapped', async () => {
      mockMatchMedia(false);
      seedSession('EventManager');
      renderShell(DASHBOARD_PATH);

      fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
      fireEvent.click(screen.getByRole('link', { name: 'Calendar' }));

      // Same Slide-driven async unmount as above.
      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument());
      expect(screen.getByText('calendar content')).toBeInTheDocument();
    });
  });
});
