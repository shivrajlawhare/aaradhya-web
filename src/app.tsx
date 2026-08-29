import { Navigate, Route, Routes } from 'react-router-dom';
import RequireRole from './components/ui/require-role';
import { Role } from './contract';
import LoginPage from './pages/login/login-page';
import DashboardPlaceholderPage from './pages/dashboard-placeholder/dashboard-placeholder-page';
import EventCreationPage from './pages/event-creation/event-creation-page';
import EventDetailPlaceholderPage from './pages/event-detail-placeholder/event-detail-placeholder-page';
import UserManagementPage from './pages/user-management/user-management-page';
import {
  DASHBOARD_PATH,
  EVENT_CREATE_PATH,
  EVENT_DETAIL_PATH_PATTERN,
  LOGIN_PATH,
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
      <Route
        path={EVENT_CREATE_PATH}
        element={
          <RequireRole roles={[Role.EventManager]}>
            <EventCreationPage />
          </RequireRole>
        }
      />
      <Route path={EVENT_DETAIL_PATH_PATTERN} element={<EventDetailPlaceholderPage />} />
      <Route path="*" element={<Navigate to={LOGIN_PATH} replace />} />
    </Routes>
  );
};

export default App;
