import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';

export default function VerifyEmailPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const next = params.get('next');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.hasBusinessProfile) {
    return <Navigate to={`/onboarding/business-profile${next ? `?next=${encodeURIComponent(next)}` : ''}`} replace />;
  }

  return <Navigate to={next && next.startsWith('/') ? next : '/dashboard'} replace />;
}
