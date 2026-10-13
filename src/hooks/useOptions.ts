import { useI18n } from '@/i18n/I18nProvider';
import type { Dict } from '@/i18n/en';

/** Turn a dictionary option group into select/radio options in the current language. */
export function useOptions() {
  const { d } = useI18n();
  return <K extends keyof Dict['options']>(group: K) =>
    Object.entries(d.options[group] as Record<string, string>).map(([value, label]) => ({ value, label }));
}

export function useOptionLabel() {
  const { d } = useI18n();
  return <K extends keyof Dict['options']>(group: K, value: string | undefined) =>
    value ? ((d.options[group] as Record<string, string>)[value] ?? value) : '-';
}
