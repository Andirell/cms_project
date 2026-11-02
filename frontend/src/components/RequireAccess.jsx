import { Navigate, useLocation } from 'react-router-dom';
import { homePathForUser, useAuth } from '../lib/auth.jsx';

// This only decides which screens to show. The API checks permissions on every request.
export default function RequireAccess({ permission, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const next = encodeURIComponent(location.pathname);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (permission && !user[permission]) {
    return <Navigate to={homePathForUser(user)} replace />;
  }

  return children;
}
