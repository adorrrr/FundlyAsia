import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from './providers/AuthProvider';

/** SME-only routes. Sends people to the step they still need: log in → verify → profile. */
export function RequireSme({ allowNoProfile = false }: { allowNoProfile?: boolean }) {
  const { user, initializing } = useAuth();
  const loc = useLocation();
  const next = encodeURIComponent(loc.pathname + loc.search);

  if (initializing) {
    return <div className="min-h-dvh flex items-center justify-center text-slate">Loading...</div>;
  }

  if (!user) return <Navigate to={`/login?next=${next}`} replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (!user.hasBusinessProfile && !allowNoProfile) return <Navigate to={`/onboarding/business-profile?next=${next}`} replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { user, initializing } = useAuth();
  if (initializing) {
    return <div className="min-h-dvh flex items-center justify-center text-slate">Loading...</div>;
  }
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

/** Logged-in SMEs skip the login/sign-up screens. */
export function GuestOnly() {
  const { user, initializing } = useAuth();
  const [params] = useSearchParams();
  const next = params.get('next');

  if (initializing) {
    return <div className="min-h-dvh flex items-center justify-center text-slate">Loading...</div>;
  }

  if (user?.role === 'sme') {
    if (next && next.startsWith('/') && !next.startsWith('/login') && !next.startsWith('/signup')) {
      return <Navigate to={next} replace />;
    }
    if (!user.hasBusinessProfile) {
      return <Navigate to="/onboarding/business-profile" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
