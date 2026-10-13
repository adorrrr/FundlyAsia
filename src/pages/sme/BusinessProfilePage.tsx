import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { businessService, ServiceError } from '@/services';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback';
import { ProfileForm, emptyProfile } from '@/components/forms/ProfileForm';
import { useToast } from '@/components/ui/Toast';

export default function BusinessProfilePage() {
  const { d, t, formatDate } = useI18n();
  useDocumentTitle(d.profile.title);
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsync(() => businessService.getProfile(user!.id), [user?.id]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={d.profile.title}
        body={d.profile.body}
        meta={data ? <span className="text-meta text-slate">{t(d.profile.lastUpdated, { date: formatDate(data.updatedAt) })}</span> : undefined}
      />
      {loading ? (
        <LoadingBlock rows={3} />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : (
        <ProfileForm
          key={data?.updatedAt}
          initial={data ? { ...data } : { ...emptyProfile, ownerName: user!.name, email: user!.email }}
          submitLabel={d.common.save}
          onCancel={() => nav('/dashboard')}
          onSubmit={async (v) => {
            try {
              const saved = await businessService.saveProfile(user!.id, v);
              setData(saved);
              refresh();
              toast(d.common.saved);
              nav('/dashboard');
            } catch (err) {
              if (err instanceof ServiceError && err.code === 'invalid_credentials') {
                toast('Session expired. Please sign in again.', 'error');
                nav('/auth/login');
              } else if (err instanceof ServiceError && err.code === 'validation') {
                toast(d.validation.fixErrors, 'error');
              } else {
                toast(d.validation.fixErrors, 'error');
              }
            }
          }}
        />
      )}
    </div>
  );
}

