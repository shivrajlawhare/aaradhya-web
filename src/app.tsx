import { Navigate, Route, Routes } from 'react-router-dom';
import RequireRole from './components/ui/require-role';
import { Role } from './contract';
import CalendarPage from './pages/calendar/calendar-page';
import LoginPage from './pages/login/login-page';
import DashboardPlaceholderPage from './pages/dashboard-placeholder/dashboard-placeholder-page';
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
      <Route path={DASHBOARD_PATH} element={<DashboardPlaceholderPage />} />
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
          restriction either; EventDetailPage itself gates editing and the
          Activity sub-tab to Event Manager internally. */}
      <Route path={EVENT_DETAIL_PATH_PATTERN} element={<EventDetailPage />} />
      {/* No RequireRole — every field this screen shows (Client Details,
          Sessions, Accommodation, the Total Cost Summary rollup) is already
          visible to any authenticated caller via the Overview/Rooms/
          Sessions tabs and GET /events/:id/quotation-summary itself; this
          screen is a different arrangement of the same already-visible
          data, not a new leak. Only the Share PDF action inside it is
          gated to Event Manager, since generating the PDF calls the
          Event-Manager-only STORY-043 endpoint. */}
      <Route path={QUOTATION_PREVIEW_PATH_PATTERN} element={<QuotationPreviewPage />} />
      {/* No RequireRole — GET /calendar (STORY-034) has no role restriction
          either, same as GET /events. */}
      <Route path={CALENDAR_PATH} element={<CalendarPage />} />
      <Route path="*" element={<Navigate to={LOGIN_PATH} replace />} />
    </Routes>
  );
};

export default App;
