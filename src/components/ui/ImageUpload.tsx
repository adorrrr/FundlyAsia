import { useId, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/utils/cn';
import { Button } from './Button';

const MAX = 2 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Local image picker with preview and validation. In preview mode the file stays in the
 * browser as an object URL; the live app would upload it through the API.
 */
export function ImageUpload({ label, value, onChange, shape = 'wide' }: { label: string; value?: string; onChange: (url: string | undefined) => void; shape?: 'wide' | 'round' }) {
  const { d } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const id = useId();

  const pick = (file?: File) => {
    if (!file) return;
    if (!TYPES.includes(file.type) || file.size > MAX) {
      setError(d.validation.image);
      return;
    }
    setError(undefined);
    onChange(URL.createObjectURL(file));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-l`} className="text-meta font-semibold">{label}</span>
      <div
        className={cn(
          'flex items-center gap-4 rounded-card border border-dashed p-3',
          error ? 'border-bad/60 bg-bad-soft/30' : 'border-line bg-paper/60',
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files?.[0]);
        }}
      >
        <div className={cn('flex flex-none items-center justify-center overflow-hidden bg-mist text-slate', shape === 'round' ? 'h-16 w-16 rounded-full' : 'h-16 w-28 rounded-control')}>
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5" aria-hidden />}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => input.current?.click()} aria-describedby={`${id}-h`}>
              {value ? d.admin.mc.replace : d.admin.mc.upload}
            </Button>
            {value && (
              <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => onChange(undefined)}>
                {d.admin.mc.remove}
              </Button>
            )}
          </div>
          <p id={`${id}-h`} className={cn('text-meta', error ? 'text-bad' : 'text-slate')} role={error ? 'alert' : undefined}>
            {error ?? d.admin.mc.uploadHelp}
          </p>
        </div>
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
      </div>
    </div>
  );
}
