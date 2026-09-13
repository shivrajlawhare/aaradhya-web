import { Navigate, Route, Routes } from 'react-router-dom';
import RequireRole from './components/ui/require-role';
import { Role } from './contract';
import CalendarPage from './pages/calendar/calendar-page';
import DashboardPage from './pages/dashboard/dashboard-page';
import LoginPage from './pages/login/login-page';
import EventCreationPage from './pages/event-creation/event-creation-page';
import EventDetailPage from './pages/event-detail/event-detail-page';
import EventListPage from './pages/event-list/event-list-page';
import QuotationPreviewPage from './pages/quotation-preview/quotation-preview-page';
import UserManagementPage from './pages/user-management/user-management-page';
import {
  CALENDAR_PATH,
  DASHBOARD_PATH,
  EVENT_CREATE_PATH,
  EVENT_DETAIL_PATH_PATTERN,
  EVENT_LIST_PATH,
  LOGIN_PATH,
  QUOTATION_PREVIEW_PATH_PATTERN,
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
      <Route path={DASHBOARD_PATH} element={<DashboardPage />} />
      <Route
        path={USER_MANAGEMENT_PATH}
        element={
          <RequireRole roles={[Role.EventManager]}>
            <UserManagementPage />
          </RequireRole>
        }
      />
      {/* No RequireRole — GET /events (STORY-013) has no role restriction;
          every authenticated caller sees the same unfiltered list. */}
      <Route path={EVENT_LIST_PATH} element={<EventListPage />} />
      <Route
        path={EVENT_CREATE_PATH}
        element={
          <RequireRole roles={[Role.EventManager]}>
            <EventCreationPage />
          </RequireRole>
        }
      />
      {/* No RequireRole — GET /events/:id (STORY-013) has no role
          restriction either; every role legitimately opens this screen,
          just seeing a different subset of tabs. EventDetailPage itself
          gates editing, the Activity sub-tab, and (STORY-052) the Rooms/
          Sessions tabs and each one's own Setup/Menu detail per role. */}
      <Route path={EVENT_DETAIL_PATH_PATTERN} element={<EventDetailPage />} />
      {/* RequireRole([EventManager]) as of STORY-052 — this screen shows the
          exact same full financial breakdown (Grand Total, extras,
          accommodation/session costs) that story scoped to Event Manager
          only everywhere else on Event Detail. The previous "no RequireRole"
          reasoning ("every field this screen shows is already visible to
          any authenticated caller via the Overview/Rooms/Sessions tabs")
          stopped being true the moment those tabs became role-filtered —
          leaving this route open would have been a direct bypass of the
          very gating STORY-052 exists to add. */}
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
      <Route path={CALENDAR_PATH} element={<CalendarPage />} />
      <Route path="*" element={<Navigate to={LOGIN_PATH} replace />} />
    </Routes>
  );
};

export default App;
