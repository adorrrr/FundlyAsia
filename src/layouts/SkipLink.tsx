import { useI18n } from '@/i18n/I18nProvider';

export function SkipLink() {
  const { d } = useI18n();
  return (
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-control focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
      {d.common.skipToContent}
    </a>
  );
}
