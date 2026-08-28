import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { Role } from '../../contract';
import { DASHBOARD_PATH, LOGIN_PATH } from '../../routes';
import { useAuth } from '../../stores/auth-context';

interface RequireRoleProps {
  roles: Role[];
  children: ReactNode;
}

// Wraps a <Route element> so it's unreachable by navigation for the wrong
// audience: no session -> back to login; wrong role -> back to the dashboard.
// Neither branch renders the guarded screen, even briefly.
const RequireRole = ({ roles, children }: RequireRoleProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={DASHBOARD_PATH} replace />;
  }

  return children;
};

export default RequireRole;
