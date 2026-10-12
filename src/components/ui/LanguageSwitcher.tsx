import { useI18n } from '@/i18n/I18nProvider';
import type { Lang } from '@/types';
import { cn } from '@/utils/cn';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, d } = useI18n();
  const opts: { v: Lang; label: string; long: string }[] = [
    { v: 'en', label: 'EN', long: d.common.english },
    { v: 'bn', label: 'বাংলা', long: d.common.bangla },
  ];
  return (
    <div role="group" aria-label={d.common.language} className={cn('inline-flex rounded-full bg-mist p-0.5', className)}>
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          lang={o.v}
          onClick={() => setLang(o.v)}
          aria-pressed={lang === o.v}
          aria-label={o.long}
          className={cn(
            'h-8 min-w-[44px] rounded-full px-2.5 text-meta font-semibold transition-[background-color,color,box-shadow] duration-200',
            lang === o.v ? 'bg-surface text-ink shadow-hair' : 'text-slate hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
