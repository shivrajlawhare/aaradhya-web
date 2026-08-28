import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/login/login-page';
import DashboardPlaceholderPage from './pages/dashboard-placeholder/dashboard-placeholder-page';
import { DASHBOARD_PATH, LOGIN_PATH } from './routes';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={LOGIN_PATH} replace />} />
      <Route path={LOGIN_PATH} element={<LoginPage />} />
      <Route path={DASHBOARD_PATH} element={<DashboardPlaceholderPage />} />
      <Route path="*" element={<Navigate to={LOGIN_PATH} replace />} />
    </Routes>
  );
};

export default App;
