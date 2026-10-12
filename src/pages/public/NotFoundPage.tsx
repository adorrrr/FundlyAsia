import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  const { d } = useI18n();
  return (
    <div className="shell flex flex-col items-start py-24">
      <div aria-hidden className="mb-8 flex flex-col gap-2">
        <span className="h-3 w-24 rounded-full bg-brand-mark" />
        <span className="h-3 w-16 rounded-full bg-brand-mark/60" />
        <span className="h-3 w-6 rounded-full bg-ink" />
      </div>
      <h1 className="text-page font-bold">{d.common.notFoundTitle}</h1>
      <p className="mt-3 text-lead text-slate">{d.common.notFoundBody}</p>
      <Button to="/" className="mt-8">{d.common.goHome}</Button>
    </div>
  );
}
