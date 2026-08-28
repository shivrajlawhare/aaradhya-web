import { Navigate, Route, Routes } from 'react-router-dom';
import RequireRole from './components/ui/require-role';
import { Role } from './contract';
import LoginPage from './pages/login/login-page';
import DashboardPlaceholderPage from './pages/dashboard-placeholder/dashboard-placeholder-page';
import UserManagementPage from './pages/user-management/user-management-page';
import { DASHBOARD_PATH, LOGIN_PATH, USER_MANAGEMENT_PATH } from './routes';

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
      <Route path="*" element={<Navigate to={LOGIN_PATH} replace />} />
    </Routes>
  );
};

export default App;
