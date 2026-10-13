import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, Info, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/utils/cn';
import { Button } from './Button';

const MAX = 2 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Local image picker with preview and validation. In preview mode the file stays in the
 * browser as an object URL; the live app would upload it through the API.
 * `variant="cover"` shows a large 16:9 preview for masterclass covers.
 */
export function ImageUpload({
  label,
  value,
  onChange,
  shape = 'wide',
  variant = 'compact',
}: {
  label: string;
  value?: string;
  onChange: (url: string | undefined) => void;
  shape?: 'wide' | 'round';
  variant?: 'compact' | 'cover';
}) {
  const { d } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const localUrl = useRef<string>();
  const [error, setError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const [local, setLocal] = useState(false);
  const id = useId();

  useEffect(() => () => {
    if (localUrl.current) URL.revokeObjectURL(localUrl.current);
  }, []);

  useEffect(() => {
    if (localUrl.current && localUrl.current !== value) {
      URL.revokeObjectURL(localUrl.current);
      localUrl.current = undefined;
      setLocal(false);
    }
  }, [value]);

  const pick = (file?: File) => {
    if (!file) return;
    if (!TYPES.includes(file.type) || file.size > MAX) {
      setError(d.validation.image);
      return;
    }
    setError(undefined);
    setLocal(true);
    if (localUrl.current) URL.revokeObjectURL(localUrl.current);
    localUrl.current = URL.createObjectURL(file);
    onChange(localUrl.current);
  };

  const controls = (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" onClick={() => input.current?.click()} aria-describedby={`${id}-h`} icon={<ImagePlus className="h-3.5 w-3.5" />}>
        {value ? d.admin.mc.replace : d.admin.mc.upload}
      </Button>
      {value && (
        <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => {
          if (localUrl.current) URL.revokeObjectURL(localUrl.current);
          localUrl.current = undefined;
          onChange(undefined);
          setLocal(false);
        }}>
          {d.admin.mc.remove}
        </Button>
      )}
    </div>
  );
  const help = (
    <p id={`${id}-h`} className={cn('text-meta', error ? 'text-bad' : 'text-slate')} role={error ? 'alert' : undefined}>
      {error ?? (variant === 'cover' ? `${d.admin.mc.uploadHelp} ${d.admin.mc.coverHelp}` : d.admin.mc.uploadHelp)}
    </p>
  );
  const dropProps = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragging(true); },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); },
  };
  const fileInput = (
    <input
      ref={input}
      type="file"
      accept={TYPES.join(',')}
      className="sr-only"
      aria-labelledby={`${id}-l`}
      tabIndex={-1}
      onChange={(e) => {
        pick(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
  );

  if (variant === 'cover') {
    return (
      <div className="flex flex-col gap-2.5">
        <span id={`${id}-l`} className="text-meta font-semibold">{label}</span>
        <button
          type="button"
          onClick={() => input.current?.click()}
          {...dropProps}
          className={cn(
            'relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-card border border-dashed transition-colors',
            error ? 'border-bad/60 bg-bad-soft/30' : dragging ? 'border-brand bg-brand-soft/50' : 'border-line bg-paper hover:border-slate/40',
          )}
          aria-label={value ? d.admin.mc.replace : d.admin.mc.upload}
        >
          {value ? (
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-meta font-medium text-slate">
              <ImagePlus className="h-6 w-6" aria-hidden />
              {d.admin.mc.upload}
            </span>
          )}
        </button>
        {controls}
        {help}
        {local && (
          <p className="flex gap-1.5 text-meta text-warn" role="status">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden />
            {d.admin.mc.previewOnly}
          </p>
        )}
        {fileInput}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-l`} className="text-meta font-semibold">{label}</span>
      <div
        className={cn('flex items-center gap-4 rounded-card border border-dashed p-3', error ? 'border-bad/60 bg-bad-soft/30' : dragging ? 'border-brand bg-brand-soft/50' : 'border-line bg-paper/60')}
        {...dropProps}
      >
        <div className={cn('flex flex-none items-center justify-center overflow-hidden bg-mist text-slate', shape === 'round' ? 'h-16 w-16 rounded-full' : 'aspect-[16/9] w-28 rounded-control')}>
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5" aria-hidden />}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          {controls}
          {help}
        </div>
        {fileInput}
      </div>
      {local && <p className="text-meta text-warn" role="status">{d.admin.mc.previewOnly}</p>}
    </div>
  );
}
