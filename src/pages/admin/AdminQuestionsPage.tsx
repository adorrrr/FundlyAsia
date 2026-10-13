import { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { eligibilityService } from '@/services';
import type { AnswerType, Question, QuestionCategory } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { SelectField, Switch, TextField, TextareaField } from '@/components/ui/Field';
import { FilterPills, SearchInput } from '@/components/ui/SearchInput';
import { LoadingBlock, Notice, EmptyState } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { QuestionField } from '@/components/eligibility/QuestionField';
import { isBlank } from '@/utils/validation';

const CATEGORIES: QuestionCategory[] = ['business_information', 'financials', 'financial_records', 'banking', 'compliance', 'existing_debt', 'funding_requirement'];
const TYPES: AnswerType[] = ['single_choice', 'select', 'number', 'currency', 'text'];
const hasOptions = (t: AnswerType) => t === 'single_choice' || t === 'select';

function blankQuestion(n: number): Question {
  return { id: `Q-NEW-${String(n).padStart(2, '0')}`, step: 1, text: { en: '', bn: '' }, category: 'business_information', answerType: 'single_choice', options: [{ value: 'opt_1', label: { en: '', bn: '' } }], required: true, weight: null, ruleRef: null, active: true };
}

export default function AdminQuestionsPage() {
  const { d, formatNumber } = useI18n();
  const a = d.admin.questions;
  useDocumentTitle(a.title);
  const toast = useToast();
  const { data, loading, setData } = useAsync(() => eligibilityService.getQuestions({ includeInactive: true }), []);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'all' | QuestionCategory>('all');
  const [edit, setEdit] = useState<{ q: Question; isNew: boolean } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<Question | null>(null);
  const [previewValue, setPreviewValue] = useState('');

  const rows = useMemo(() => {
    const query = q.toLowerCase();
    return (data ?? []).filter((x) => (cat === 'all' || x.category === cat) && (!query || [x.id, x.text.en, x.text.bn].some((s) => s.toLowerCase().includes(query))));
  }, [data, q, cat]);

  const [busy, setBusy] = useState(false);

  const toggle = async (x: Question, active: boolean) => {
    try {
      setData((qs) => qs?.map((y) => (y.id === x.id ? { ...y, active } : y)));
      await eligibilityService.setQuestionActive(x.id, active);
      toast(a.toggled);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : d.common.errorTitle, 'error');
    }
  };

  const save = async () => {
    if (!edit) return;
    const x = edit.q;
    const e: Record<string, string> = {};
    if (isBlank(x.id)) e.id = d.validation.required;
    else if (edit.isNew && data?.some((y) => y.id === x.id)) e.id = `${x.id} ✕`;
    if (isBlank(x.text.en)) e.en = d.validation.required;
    if (isBlank(x.text.bn)) e.bn = d.validation.required;
    if (hasOptions(x.answerType) && !(x.options ?? []).some((o) => !isBlank(o.label.en))) e.options = d.validation.minOne;
    if (x.weight != null && (Number.isNaN(x.weight) || x.weight < 0)) e.weight = d.validation.positive;
    setErrors(e);
    if (Object.keys(e).length) {
      toast(d.validation.fixErrors, 'error');
      return;
    }
    setBusy(true);
    try {
      const clean: Question = { ...x, options: hasOptions(x.answerType) ? (x.options ?? []).filter((o) => !isBlank(o.label.en)) : undefined, ruleRef: isBlank(x.ruleRef ?? '') ? null : x.ruleRef };
      await eligibilityService.saveQuestion(clean);
      setData((qs) => (edit.isNew ? [...(qs ?? []), clean] : qs?.map((y) => (y.id === clean.id ? clean : y))));
      setEdit(null);
      toast(a.saved);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : d.common.errorTitle, 'error');
    } finally {
      setBusy(false);
    }
  };

  const upd = (patch: Partial<Question>) => setEdit((s) => (s ? { ...s, q: { ...s.q, ...patch } } : s));

  if (loading) return <LoadingBlock rows={5} />;

  return (
    <div>
      <PageHeader title={a.title} body={a.body} actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => { setErrors({}); setEdit({ q: blankQuestion((data?.length ?? 0) + 1), isNew: true }); }}>{a.add}</Button>} />
      <Notice tone="info" className="mb-5">{d.admin.rules.mappingPending}</Notice>
      <div className="mb-4 flex flex-col gap-3">
        <SearchInput value={q} onChange={setQ} placeholder={d.common.search} />
        <FilterPills label={a.category} value={cat} onChange={setCat} options={[{ value: 'all', label: d.common.all }, ...CATEGORIES.map((c) => ({ value: c, label: a.categories[c] }))]} />
      </div>

      {!rows.length ? (
        <EmptyState title={d.common.noResults} />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((x) => (
            <li key={x.id} className="surface flex flex-col gap-3 p-4 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tnum text-meta font-semibold text-slate">{x.id}</span>
                  <Badge tone="neutral" dot={false}>{a.step} {formatNumber(x.step)} · {a.categories[x.category]}</Badge>
                  <Badge tone="info" dot={false}>{a.types[x.answerType]}</Badge>
                  {x.showWhen && <Badge tone="neutral" dot={false}>↳ {x.showWhen.questionId}</Badge>}
                </div>
                <p className="mt-1.5 font-medium">{x.text.en}</p>
                <p lang="bn" className="text-body text-slate">{x.text.bn}</p>
                <p className="mt-1 text-meta text-slate">{a.weight}: {x.weight ?? a.weightUnset} · {a.rule}: {x.ruleRef ?? a.ruleUnset}</p>
              </div>
              <div className="flex flex-none items-center gap-1">
                <label className="mr-2 flex items-center gap-2 text-meta font-semibold">
                  <Switch checked={x.active} onChange={(v) => toggle(x, v)} label={`${a.active}: ${x.id}`} />
                  <span className={x.active ? 'text-ok' : 'text-slate'}>{x.active ? d.status.active : d.status.inactive}</span>
                </label>
                <Button size="sm" variant="ghost" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => { setPreviewValue(''); setPreview(x); }}>{a.preview}</Button>
                <Button size="sm" variant="ghost" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => { setErrors({}); setEdit({ q: structuredClone(x), isNew: false }); }}>{d.common.edit}</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!preview} onClose={() => setPreview(null)} title={a.previewTitle} description={preview?.id} size="md">
        {preview && <QuestionField q={preview} value={previewValue} onChange={setPreviewValue} />}
      </Dialog>

      <Dialog
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.isNew ? a.addTitle : a.editTitle}
        size="lg"
        footer={<><Button variant="secondary" onClick={() => setEdit(null)} disabled={busy}>{d.common.cancel}</Button><Button onClick={save} loading={busy}>{d.common.save}</Button></>}
      >
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={a.id} value={edit.q.id} onChange={(e) => upd({ id: e.target.value.toUpperCase() })} disabled={!edit.isNew} error={errors.id} required />
            <SelectField label={a.step} value={String(edit.q.step)} onChange={(e) => upd({ step: Number(e.target.value) })} options={d.elig.steps.slice(0, 6).map((s, i) => ({ value: String(i + 1), label: `${formatNumber(i + 1)}. ${s}` }))} />
            <TextareaField className="sm:col-span-2" rows={2} label={a.textEn} value={edit.q.text.en} onChange={(e) => upd({ text: { ...edit.q.text, en: e.target.value } })} error={errors.en} required />
            <TextareaField className="sm:col-span-2" rows={2} lang="bn" label={a.textBn} value={edit.q.text.bn} onChange={(e) => upd({ text: { ...edit.q.text, bn: e.target.value } })} error={errors.bn} required />
            <SelectField label={a.category} value={edit.q.category} onChange={(e) => upd({ category: e.target.value as QuestionCategory })} options={CATEGORIES.map((c) => ({ value: c, label: a.categories[c] }))} />
            <SelectField label={a.answerType} value={edit.q.answerType} onChange={(e) => upd({ answerType: e.target.value as AnswerType, options: hasOptions(e.target.value as AnswerType) ? edit.q.options ?? [{ value: 'opt_1', label: { en: '', bn: '' } }] : undefined })} options={TYPES.map((t) => ({ value: t, label: a.types[t] }))} />
            {hasOptions(edit.q.answerType) && (
              <fieldset className="flex flex-col gap-3 rounded-card bg-paper p-4 sm:col-span-2">
                <legend className="mb-1 text-meta font-semibold">{a.options}</legend>
                {errors.options && <p role="alert" className="text-meta text-bad">{errors.options}</p>}
                {(edit.q.options ?? []).map((o, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <TextField label={a.optionEn} value={o.label.en} onChange={(e) => upd({ options: edit.q.options!.map((x, j) => (j === i ? { ...x, label: { ...x.label, en: e.target.value } } : x)) })} />
                    <TextField label={a.optionBn} lang="bn" value={o.label.bn} onChange={(e) => upd({ options: edit.q.options!.map((x, j) => (j === i ? { ...x, label: { ...x.label, bn: e.target.value } } : x)) })} />
                    <Button variant="ghost" aria-label={d.admin.mc.remove} disabled={edit.q.options!.length === 1} onClick={() => upd({ options: edit.q.options!.filter((_, j) => j !== i) })} icon={<X className="h-4 w-4" />} className="sm:w-11 sm:px-0"><span className="sm:sr-only">{d.admin.mc.remove}</span></Button>
                  </div>
                ))}
                <Button size="sm" variant="secondary" className="self-start" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => upd({ options: [...(edit.q.options ?? []), { value: `opt_${(edit.q.options?.length ?? 0) + 1}`, label: { en: '', bn: '' } }] })}>{a.addOption}</Button>
              </fieldset>
            )}
            <TextField label={a.weight} type="number" min={0} inputMode="decimal" placeholder={a.weightUnset} value={edit.q.weight == null ? '' : String(edit.q.weight)} onChange={(e) => upd({ weight: e.target.value === '' ? null : Number(e.target.value) })} error={errors.weight} hint={a.ruleHelp} />
            <TextField label={a.rule} placeholder={a.ruleUnset} value={edit.q.ruleRef ?? ''} onChange={(e) => upd({ ruleRef: e.target.value })} hint={a.ruleHelp} />
            <label className="flex items-center gap-3 text-body font-medium sm:col-span-2">
              <Switch checked={edit.q.active} onChange={(v) => upd({ active: v })} label={a.active} />
              {a.active}
            </label>
          </div>
        )}
      </Dialog>
    </div>
  );
}
