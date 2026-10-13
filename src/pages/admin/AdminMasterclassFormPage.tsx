import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService } from '@/services';
import type { MasterclassInput } from '@/services/masterclassService';
import type { Localized, MasterclassStatus, Speaker } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { SelectField, TextField, TextareaField } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { EmptyState, LoadingBlock, Notice } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { MC_STATUSES } from './AdminMasterclassesPage';
import { isBlank } from '@/utils/validation';

const blankL = (): Localized => ({ en: '', bn: '' });
const NEW_SPEAKER = '__new';

const empty: MasterclassInput = {
  title: blankL(),
  topic: blankL(),
  description: blankL(),
  summary: blankL(),
  learn: [blankL()],
  date: '',
  startTime: '',
  endTime: '',
  venue: blankL(),
  capacity: 30,
  registrationDeadline: '',
  fee: 0,
  status: 'draft',
  speakerId: '',
  coverTone: 'leaf',
};

type Errors = Record<string, string>;

/** First sentence of the description, used as the short card summary. */
const summarise = (s: string) => (s.split(/(?<=[.।!?])\s/)[0] ?? s).slice(0, 180);

export default function AdminMasterclassFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const { d } = useI18n();
  const a = d.admin.mc;
  useDocumentTitle(editing ? a.editTitle : a.createTitle);
  const nav = useNavigate();
  const toast = useToast();
  const existing = useAsync(async () => (id ? masterclassService.get(id) : null), [id]);
  const speakers = useAsync(() => masterclassService.listSpeakers(), []);
  const [v, setV] = useState<MasterclassInput>(empty);
  const [sp, setSp] = useState<Omit<Speaker, 'id'>>({ name: '', designation: '', institution: '', bio: blankL() });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState<false | 'draft' | 'save'>(false);

  useEffect(() => {
    if (existing.data) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _i, slug: _s, seatsTaken: _t, ...rest } = existing.data;
      setV(rest);
    }
  }, [existing.data]);

  if (existing.loading || speakers.loading) return <LoadingBlock rows={4} />;
  if (editing && !existing.data) return <EmptyState title={d.mc.notFound} action={<Button to="/admin/masterclasses" variant="secondary">{a.title}</Button>} />;

  const set = <K extends keyof MasterclassInput>(k: K, val: MasterclassInput[K]) => setV((x) => ({ ...x, [k]: val }));
  const setL = (k: 'title' | 'topic' | 'description' | 'venue', lang: 'en' | 'bn', val: string) => setV((x) => ({ ...x, [k]: { ...x[k], [lang]: val } }));
  const err = (k: string) => errors[k];

  const validate = (status: MasterclassStatus): Errors => {
    const e: Errors = {};
    const req = d.validation.required;
    if (isBlank(v.title.en)) e['title.en'] = req;
    if (isBlank(v.title.bn)) e['title.bn'] = req;
    if (status === 'draft') return e;
    if (isBlank(v.topic.en)) e['topic.en'] = req;
    if (isBlank(v.description.en)) e['description.en'] = req;
    if (!v.date) e.date = req;
    if (!v.startTime) e.startTime = req;
    if (!v.endTime) e.endTime = req;
    else if (v.startTime && v.endTime <= v.startTime) e.endTime = d.validation.timeOrder;
    if (isBlank(v.venue.en)) e['venue.en'] = req;
    if (!v.capacity || v.capacity < 1) e.capacity = d.validation.positive;
    if (!v.registrationDeadline) e.registrationDeadline = req;
    if (v.fee < 0 || Number.isNaN(v.fee)) e.fee = d.validation.positive;
    if (!v.speakerId) e.speakerId = req;
    if (v.speakerId === NEW_SPEAKER && isBlank(sp.name)) e['sp.name'] = req;
    if (!v.learn.some((p) => !isBlank(p.en))) e.learn = d.validation.minOne;
    return e;
  };

  const save = async (mode: 'draft' | 'save', ev?: FormEvent) => {
    ev?.preventDefault();
    const status = mode === 'draft' ? 'draft' : v.status;
    const e = validate(status);
    setErrors(e);
    if (Object.keys(e).length) {
      toast(d.validation.fixErrors, 'error');
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setBusy(mode);
    try {
      let speakerId = v.speakerId;
      if (speakerId === NEW_SPEAKER) speakerId = (await masterclassService.saveSpeaker(sp)).id;
      const payload: MasterclassInput = {
        ...v,
        status,
        speakerId,
        learn: v.learn.filter((p) => !isBlank(p.en) || !isBlank(p.bn)),
        summary: { en: summarise(v.description.en), bn: summarise(v.description.bn) },
      };
      if (editing && id) await masterclassService.update(id, payload);
      else await masterclassService.create(payload);
      toast(editing ? a.updated : a.created);
      nav('/admin/masterclasses');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : d.common.errorTitle;
      toast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const speakerOpts = [...(speakers.data ?? []).map((s) => ({ value: s.id, label: `${s.name} - ${s.institution}` })), { value: NEW_SPEAKER, label: `+ ${a.speakerNew}` }];

  return (
    <form onSubmit={(e) => save('save', e)} noValidate>
      <PageHeader back={{ to: '/admin/masterclasses', label: a.title }} title={editing ? a.editTitle : a.createTitle} />
      {Object.keys(errors).length > 0 && <Notice tone="warn" className="mb-5">{d.validation.fixErrors}</Notice>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <fieldset className="surface grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <legend className="contents"><h2 className="text-card font-semibold sm:col-span-2">{a.sectionBasics}</h2></legend>
            <TextField label={a.titleEn} value={v.title.en} onChange={(e) => setL('title', 'en', e.target.value)} error={err('title.en')} required />
            <TextField label={a.titleBn} lang="bn" value={v.title.bn} onChange={(e) => setL('title', 'bn', e.target.value)} error={err('title.bn')} required />
            <TextField label={a.topicEn} value={v.topic.en} onChange={(e) => setL('topic', 'en', e.target.value)} error={err('topic.en')} />
            <TextField label={a.topicBn} lang="bn" value={v.topic.bn} onChange={(e) => setL('topic', 'bn', e.target.value)} />
            <TextareaField label={a.descEn} value={v.description.en} onChange={(e) => setL('description', 'en', e.target.value)} error={err('description.en')} />
            <TextareaField label={a.descBn} lang="bn" value={v.description.bn} onChange={(e) => setL('description', 'bn', e.target.value)} />
          </fieldset>

          <fieldset className="surface grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
            <legend className="contents"><h2 className="text-card font-semibold sm:col-span-3">{a.sectionSchedule}</h2></legend>
            <TextField label={a.date} type="date" value={v.date} onChange={(e) => set('date', e.target.value)} error={err('date')} />
            <TextField label={a.start} type="time" value={v.startTime} onChange={(e) => set('startTime', e.target.value)} error={err('startTime')} />
            <TextField label={a.end} type="time" value={v.endTime} onChange={(e) => set('endTime', e.target.value)} error={err('endTime')} />
            <TextField className="sm:col-span-3" label={a.venueEn} value={v.venue.en} onChange={(e) => setL('venue', 'en', e.target.value)} error={err('venue.en')} />
            <TextField className="sm:col-span-3" label={a.venueBn} lang="bn" value={v.venue.bn} onChange={(e) => setL('venue', 'bn', e.target.value)} />
          </fieldset>

          <fieldset className="surface flex flex-col gap-5 p-5 sm:p-6">
            <legend className="contents"><h2 className="text-card font-semibold">{a.sectionSpeaker}</h2></legend>
            <SelectField label={a.speakerPick} value={v.speakerId} onChange={(e) => set('speakerId', e.target.value)} options={speakerOpts} placeholder={d.profile.choose} error={err('speakerId')} />
            {v.speakerId === NEW_SPEAKER && (
              <div className="grid gap-5 rounded-card bg-paper p-4 sm:grid-cols-2">
                <TextField label={a.speakerName} value={sp.name} onChange={(e) => setSp({ ...sp, name: e.target.value })} error={err('sp.name')} required />
                <TextField label={a.designation} value={sp.designation} onChange={(e) => setSp({ ...sp, designation: e.target.value })} />
                <TextField className="sm:col-span-2" label={a.institution} value={sp.institution} onChange={(e) => setSp({ ...sp, institution: e.target.value })} />
                <TextareaField label={a.bioEn} rows={3} value={sp.bio.en} onChange={(e) => setSp({ ...sp, bio: { ...sp.bio, en: e.target.value } })} />
                <TextareaField label={a.bioBn} rows={3} lang="bn" value={sp.bio.bn} onChange={(e) => setSp({ ...sp, bio: { ...sp.bio, bn: e.target.value } })} />
                <div className="sm:col-span-2"><ImageUpload label={a.speakerPhoto} shape="round" value={sp.photo} onChange={(photo) => setSp({ ...sp, photo })} /></div>
              </div>
            )}
          </fieldset>

          <fieldset className="surface flex flex-col gap-4 p-5 sm:p-6">
            <legend className="contents"><h2 className="text-card font-semibold">{a.learn}</h2></legend>
            {err('learn') && <p role="alert" className="text-meta text-bad">{err('learn')}</p>}
            {v.learn.map((p, i) => (
              <div key={i} className="grid gap-3 rounded-card border border-line p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <TextField label={a.learnEn} value={p.en} onChange={(e) => set('learn', v.learn.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)))} />
                <TextField label={a.learnBn} lang="bn" value={p.bn} onChange={(e) => set('learn', v.learn.map((x, j) => (j === i ? { ...x, bn: e.target.value } : x)))} />
                <Button variant="ghost" aria-label={a.removePoint} disabled={v.learn.length === 1} onClick={() => set('learn', v.learn.filter((_, j) => j !== i))} icon={<X className="h-4 w-4" />} className="sm:w-11 sm:px-0">
                  <span className="sm:sr-only">{a.removePoint}</span>
                </Button>
              </div>
            ))}
            <Button variant="secondary" className="self-start" icon={<Plus className="h-4 w-4" />} onClick={() => set('learn', [...v.learn, blankL()])}>{a.learnAdd}</Button>
          </fieldset>
        </div>

        <div className="flex flex-col gap-5 xl:sticky xl:top-8 xl:self-start">
          <fieldset className="surface flex flex-col gap-5 p-5 sm:p-6">
            <legend className="contents"><h2 className="text-card font-semibold">{a.sectionRegistration}</h2></legend>
            <SelectField label={d.common.status} value={v.status} onChange={(e) => set('status', e.target.value as MasterclassStatus)} options={MC_STATUSES.map((s) => ({ value: s, label: d.status[s] }))} />
            <TextField label={a.capacity} type="number" min={1} inputMode="numeric" value={String(v.capacity)} onChange={(e) => set('capacity', Number(e.target.value))} error={err('capacity')} />
            <TextField label={a.deadline} type="date" value={v.registrationDeadline} onChange={(e) => set('registrationDeadline', e.target.value)} error={err('registrationDeadline')} />
            <TextField label={a.fee} type="number" min={0} inputMode="numeric" prefix="৳" value={String(v.fee)} onChange={(e) => set('fee', Number(e.target.value))} hint={a.feeHelp} error={err('fee')} />
          </fieldset>
          <div className="surface p-5 sm:p-6">
            <ImageUpload label={a.cover} variant="cover" value={v.cover} onChange={(cover) => setV((x) => ({ ...x, cover, coverSrcSet: undefined, coverCredit: undefined, coverAlt: undefined }))} />
          </div>
          <div className="flex flex-col gap-2">
            <Button type="submit" size="lg" loading={busy === 'save'}>{editing ? a.saveChanges : a.create}</Button>
            <Button variant="secondary" loading={busy === 'draft'} onClick={() => save('draft')}>{a.saveDraft}</Button>
            <Button variant="ghost" to="/admin/masterclasses">{d.common.cancel}</Button>
          </div>
        </div>
      </div>
    </form>
  );
}
