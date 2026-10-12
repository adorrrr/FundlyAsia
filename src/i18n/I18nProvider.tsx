import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import en, { type Dict } from './en';
import bn from './bn';
import type { Lang, Localized } from '@/types';

const dictionaries: Record<Lang, Dict> = { en, bn };
const STORAGE_KEY = 'fundly.lang';

type Vars = Record<string, string | number>;

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Dictionary for direct access to arrays/objects: d.home.challenge */
  d: Dict;
  /** Interpolate a string: t(d.dash.welcome, { name }) */
  t: (template: string, vars?: Vars) => string;
  /** Pick the current-language value of a localized field. */
  l: (value: Localized | undefined) => string;
  formatDate: (iso: string, opts?: Intl.DateTimeFormatOptions) => string;
  formatTime: (hhmm: string) => string;
  formatNumber: (n: number) => string;
  formatMoney: (n: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function readStoredLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'bn' ? 'bn' : 'en';
  } catch {
    return 'en';
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* preference only — safe to ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18nValue>(() => {
    const locale = lang === 'bn' ? 'bn-BD' : 'en-GB';
    const t = (template: string, vars?: Vars) =>
      vars ? template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : template;
    const formatNumber = (n: number) => new Intl.NumberFormat(locale).format(n);
    return {
      lang,
      setLang,
      d: dictionaries[lang],
      t,
      l: (v) => (v ? v[lang] || v.en : ''),
      formatDate: (iso, opts) => {
        if (!iso) return dictionaries[lang].common.tba;
        const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
        return new Intl.DateTimeFormat(locale, opts ?? { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
      },
      formatTime: (hhmm) => {
        if (!hhmm) return dictionaries[lang].common.tba;
        const [h, m] = hhmm.split(':').map(Number);
        const d = new Date(2000, 0, 1, h, m);
        return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(d);
      },
      formatNumber,
      formatMoney: (n) => (n === 0 ? dictionaries[lang].common.free : `${formatNumber(n)} ${dictionaries[lang].common.bdt}`),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
