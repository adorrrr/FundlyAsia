import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService } from '@/services';
import type { Speaker } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { TextField, TextareaField } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { EmptyState, LoadingBlock } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { isBlank } from '@/utils/validation';

type Draft = Omit<Speaker, 'id'> & { id?: string };
const blank: Draft = { name: '', designation: '', institution: '', bio: { en: '', bn: '' } };

export default function AdminSpeakersPage() {
  const { d, l, t, formatNumber } = useI18n();
  const a = d.admin.speakers;
  const m = d.admin.mc;
  useDocumentTitle(a.title);
  const toast = useToast();
  const speakers = useAsync(() => masterclassService.listSpeakers(), []);
  const classes = useAsync(() => masterclassService.listAll(), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<Speaker | null>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    if (!draft) return;
    if (isBlank(draft.name)) return setError(d.validation.required);
    setBusy(true);
    try {
      await masterclassService.saveSpeaker(draft);
      setDraft(null);
      toast(a.saved);
      speakers.reload();
      classes.reload();
    } catch {
      toast(d.common.errorTitle);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await masterclassService.removeSpeaker(toDelete.id);
      setToDelete(null);
      toast(a.deleted);
      speakers.reload();
      classes.reload();
    } catch {
      toast(a.deleteFailed);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader back={{ to: '/admin/masterclasses', label: m.title }} title={a.title} body={a.body} actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => { setError(undefined); setDraft({ ...blank }); }}>{a.add}</Button>} />
      {speakers.loading ? (
        <LoadingBlock rows={3} />
      ) : !speakers.data?.length ? (
        <EmptyState title={a.empty} action={<Button onClick={() => setDraft({ ...blank })}>{a.add}</Button>} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {speakers.data.map((s) => (
            <li key={s.id} className="surface flex flex-col p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-full bg-mist font-bold text-slate">
                  {s.photo ? <img src={s.photo} alt="" className="h-full w-full object-cover" /> : s.name.split(' ').map((p) => p[0]).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-meta text-slate">{s.designation}</p>
                  <p className="text-meta text-slate">{s.institution}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" aria-label={`${d.common.edit} ${s.name}`} icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => { setError(undefined); setDraft({ ...s }); }}>
                    <span className="sr-only">{d.common.edit}</span>
                  </Button>
                  <Button size="sm" variant="ghost" className="text-bad hover:bg-bad-soft" aria-label={`${a.delete} ${s.name}`} icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setToDelete(s)}>
                    <span className="sr-only">{a.delete}</span>
                  </Button>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 text-body text-slate">{l(s.bio)}</p>
              <p className="mt-auto pt-4 text-meta font-semibold">{t(a.sessions, { n: formatNumber((classes.data ?? []).filter((c) => c.speakerId === s.id).length) })}</p>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? a.editTitle : a.addTitle}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)}>{d.common.cancel}</Button>
            <Button onClick={save} loading={busy}>{d.common.save}</Button>
          </>
        }
      >
        {draft && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={m.speakerName} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={error} required data-autofocus />
            <TextField label={m.designation} value={draft.designation} onChange={(e) => setDraft({ ...draft, designation: e.target.value })} />
            <TextField className="sm:col-span-2" label={m.institution} value={draft.institution} onChange={(e) => setDraft({ ...draft, institution: e.target.value })} />
            <TextareaField label={m.bioEn} rows={3} value={draft.bio.en} onChange={(e) => setDraft({ ...draft, bio: { ...draft.bio, en: e.target.value } })} />
            <TextareaField label={m.bioBn} rows={3} lang="bn" value={draft.bio.bn} onChange={(e) => setDraft({ ...draft, bio: { ...draft.bio, bn: e.target.value } })} />
            <div className="sm:col-span-2"><ImageUpload label={m.speakerPhoto} shape="round" value={draft.photo} onChange={(photo) => setDraft({ ...draft, photo })} /></div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={!!toDelete}
        onClose={() => !deleting && setToDelete(null)}
        title={a.deleteTitle}
        description={toDelete ? a.deleteBody.replace('{name}', toDelete.name) : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" data-autofocus onClick={() => setToDelete(null)} disabled={deleting}>{d.common.cancel}</Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>{a.delete}</Button>
          </>
        }
      />
    </div>
  );
}
