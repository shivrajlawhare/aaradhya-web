import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/app-shell/app-shell';
import RequireRole from './components/ui/require-role';
import { Role } from './contract';
import CalendarPage from './pages/calendar/calendar-page';
import DashboardPage from './pages/dashboard/dashboard-page';
import LoginPage from './pages/login/login-page';
import EventCreationPage from './pages/event-creation/event-creation-page';
import EventDetailPage from './pages/event-detail/event-detail-page';
import EventListPage from './pages/event-list/event-list-page';
import QuotationPreviewPage from './pages/quotation-preview/quotation-preview-page';
import SettingsPage from './pages/settings/settings-page';
import UserManagementPage from './pages/user-management/user-management-page';
import {
  CALENDAR_PATH,
  DASHBOARD_PATH,
  EVENT_CREATE_PATH,
  EVENT_DETAIL_PATH_PATTERN,
  EVENT_LIST_PATH,
  LOGIN_PATH,
  QUOTATION_PREVIEW_PATH_PATTERN,
  SETTINGS_PATH,
  USER_MANAGEMENT_PATH,
} from './routes';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={LOGIN_PATH} replace />} />
      <Route path={LOGIN_PATH} element={<LoginPage />} />
      {/* No RequireRole — GET /dashboard (STORY-047) has no role
          restriction either; it varies its own response by role
          server-side (STORY-046), so the same DashboardPage renders
          correctly for all four roles (STORY-048/049/050/051). */}
      <Route
        path={DASHBOARD_PATH}
        element={
          <AppShell title="Dashboard">
            <DashboardPage />
          </AppShell>
        }
      />
      <Route
        path={USER_MANAGEMENT_PATH}
        element={
          <AppShell title="User Management">
            <RequireRole roles={[Role.EventManager]}>
              <UserManagementPage />
            </RequireRole>
          </AppShell>
        }
      />
      {/* No RequireRole — GET /events (STORY-013) has no role restriction;
          every authenticated caller sees the same unfiltered list. */}
      <Route
        path={EVENT_LIST_PATH}
        element={
          <AppShell title="Events">
            <EventListPage />
          </AppShell>
        }
      />
      <Route
        path={EVENT_CREATE_PATH}
        element={
          // No title — EventCreationForm still renders its own "New Event"
          // h1 (STORY-053's own AC never lists this screen for the
          // dedup treatment the way it does Dashboard/Events/Calendar/User
          // Management), so AppShell doesn't render a second one.
          <AppShell>
            <RequireRole roles={[Role.EventManager]}>
              <EventCreationPage />
            </RequireRole>
          </AppShell>
        }
      />
      {/* No RequireRole — GET /events/:id (STORY-013) has no role
          restriction either; every role legitimately opens this screen,
          just seeing a different subset of tabs. EventDetailPage itself
          gates editing, the Activity sub-tab, and (STORY-052) the Rooms/
          Sessions tabs and each one's own Setup/Menu detail per role. */}
      <Route
        path={EVENT_DETAIL_PATH_PATTERN}
        element={
          // No title — the h1 here is the Event's own eventId (dynamic,
          // not one of STORY-053's four static-title screens), so AppShell
          // leaves it entirely to EventDetailPage, unchanged.
          <AppShell>
            <EventDetailPage />
          </AppShell>
        }
      />
      {/* RequireRole([EventManager]) as of STORY-052 — this screen shows the
          exact same full financial breakdown (Grand Total, extras,
          accommodation/session costs) that story scoped to Event Manager
          only everywhere else on Event Detail. The previous "no RequireRole"
          reasoning ("every field this screen shows is already visible to
          any authenticated caller via the Overview/Rooms/Sessions tabs")
          stopped being true the moment those tabs became role-filtered —
          leaving this route open would have been a direct bypass of the
          very gating STORY-052 exists to add. Not wrapped in AppShell —
          STORY-053's own AC never lists this screen among the ones the
          shell wraps, and it exists to mirror the reference quotation PDFs
          (STORY-069+) rather than sit alongside app chrome. */}
      <Route
        path={QUOTATION_PREVIEW_PATH_PATTERN}
        element={
          <RequireRole roles={[Role.EventManager]}>
            <QuotationPreviewPage />
          </RequireRole>
        }
      />
      {/* No RequireRole — GET /calendar (STORY-034) has no role restriction
          either, same as GET /events. */}
      <Route
        path={CALENDAR_PATH}
        element={
          <AppShell title="Calendar">
            <CalendarPage />
          </AppShell>
        }
      />
      {/* Event Manager only (STORY-062's own AC), matching New Event/User
          Management's own RequireRole convention — the nav row itself
          (nav-items.ts) already only renders for that role, this is the
          route-level enforcement for a direct URL visit. */}
      <Route
        path={SETTINGS_PATH}
        element={
          <AppShell title="Settings">
            <RequireRole roles={[Role.EventManager]}>
              <SettingsPage />
            </RequireRole>
          </AppShell>
        }
      />
      <Route path="*" element={<Navigate to={LOGIN_PATH} replace />} />
    </Routes>
  );
};

export default App;
