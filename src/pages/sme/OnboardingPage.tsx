import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { businessService } from '@/services';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProfileForm, emptyProfile } from '@/components/forms/ProfileForm';
import { useToast } from '@/components/ui/Toast';

export default function OnboardingPage() {
  const { d } = useI18n();
  useDocumentTitle(d.profile.onboardTitle);
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  if (!user) return null;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={d.profile.onboardTitle} body={d.profile.onboardBody} />
      <ProfileForm
        initial={{ ...emptyProfile, ownerName: user.name, email: user.email }}
        submitLabel={d.profile.saveContinue}
        onSubmit={async (v) => {
          await businessService.saveProfile(user.id, v);
          refresh();
          toast(d.common.saved);
          const next = params.get('next');
          nav(next && next.startsWith('/') && !next.startsWith('/onboarding') ? next : '/dashboard');
        }}
      />
    </div>
  );
}
