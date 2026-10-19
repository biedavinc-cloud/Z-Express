import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

// Guards every signed-in area. A visitor without a session is sent to /login and
// brought back to the page they asked for once they have signed in.
export default function ProtectedRoute({ fallback = <DefaultFallback /> }) {
  const { isAuthenticated, isLoadingAuth, authChecked } = useAuth();
  const location = useLocation();

  if (isLoadingAuth || !authChecked) return fallback;

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    const query = returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    return <Navigate to={`/login${query}`} replace />;
  }

  return <Outlet />;
}
