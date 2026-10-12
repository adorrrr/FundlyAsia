import type { Question } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { ChoiceGroup, SelectField, TextField } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';

/**
 * Renders any question from the bank by its answer type. New questions from the API
 * render without code changes as long as they use a supported answer type.
 */
export function QuestionField({ q, value, onChange, error, prefilled }: { q: Question; value: string; onChange: (v: string) => void; error?: string; prefilled?: boolean }) {
  const { d, l } = useI18n();
  const options = (q.options ?? []).map((o) => ({ value: o.value, label: l(o.label) }));
  const badge = prefilled ? <Badge tone="brand">{d.elig.prefilled}</Badge> : undefined;
  const hint = q.help ? l(q.help) : undefined;

  switch (q.answerType) {
    case 'single_choice':
      return (
        <div>
          {badge && <div className="mb-2">{badge}</div>}
          <ChoiceGroup legend={l(q.text)} hint={hint} name={q.id} value={value} onChange={onChange} options={options} error={error} required={q.required} columns={options.length === 4 ? 4 : options.length === 3 ? 3 : 2} />
        </div>
      );
    case 'select':
      return <SelectField label={l(q.text)} hint={hint} value={value} onChange={(e) => onChange(e.target.value)} options={options} placeholder={d.profile.choose} error={error} required={q.required} badge={badge} />;
    case 'number':
    case 'currency':
      return (
        <TextField
          label={l(q.text)}
          hint={hint}
          inputMode="numeric"
          prefix={q.answerType === 'currency' ? '৳' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
          error={error}
          required={q.required}
          badge={badge}
          className="sm:max-w-xs"
        />
      );
    default:
      return <TextField label={l(q.text)} hint={hint} value={value} onChange={(e) => onChange(e.target.value)} error={error} required={q.required} badge={badge} />;
  }
}

/** Human-readable answer for review screens and admin views. */
export function useAnswerLabel() {
  const { l, formatNumber, d } = useI18n();
  return (q: Question, v: string | undefined) => {
    if (!v) return d.elig.notAnswered;
    if (q.options) return l(q.options.find((o) => o.value === v)?.label) || v;
    if (q.answerType === 'currency') return `৳ ${formatNumber(Number(v.replace(/,/g, '')))}`;
    return v;
  };
}
