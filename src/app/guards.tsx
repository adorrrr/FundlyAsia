import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './providers/AuthProvider';

/** SME-only routes. Sends people to the step they still need: log in → verify → profile. */
export function RequireSme({ allowNoProfile = false }: { allowNoProfile?: boolean }) {
  const { user } = useAuth();
  const loc = useLocation();
  const next = encodeURIComponent(loc.pathname + loc.search);
  if (!user) return <Navigate to={`/login?next=${next}`} replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (!user.hasBusinessProfile && !allowNoProfile) return <Navigate to={`/onboarding/business-profile?next=${next}`} replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

/** Logged-in SMEs skip the login/sign-up screens. */
export function GuestOnly() {
  const { user } = useAuth();
  if (user?.role === 'sme') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
