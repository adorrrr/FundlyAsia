import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef, useState } from 'react';
import { AlertCircle, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useI18n } from '@/i18n/I18nProvider';

interface FieldShellProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  badge?: ReactNode;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  className?: string;
}

/** Label, hint and error wiring shared by every form control. */
export function FieldShell({ label, hint, error, required, badge, children, className }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-meta font-semibold text-ink">
          {label}
          {required && <span className="ml-0.5 text-bad" aria-hidden>*</span>}
        </label>
        {badge}
      </div>
      {children({ id, describedBy: [errId, hintId].filter(Boolean).join(' ') || undefined, invalid: !!error })}
      {error ? (
        <p id={errId} className="flex items-start gap-1.5 text-meta text-bad" role="alert">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-meta text-slate">{hint}</p>
      ) : null}
    </div>
  );
}

export const controlCls = (invalid?: boolean) =>
  cn(
    'w-full rounded-control border bg-surface px-3.5 text-body text-ink placeholder:text-slate/70 transition-[border-color,box-shadow] duration-150',
    'focus:outline-none focus:border-brand focus:shadow-focus disabled:bg-mist disabled:text-slate',
    invalid ? 'border-bad/70 focus:border-bad focus:shadow-[0_0_0_3px_rgb(var(--bad)/0.18)]' : 'border-line hover:border-slate/40',
  );

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  badge?: ReactNode;
  prefix?: string;
};

export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField(
  { label, hint, error, required, badge, prefix, className, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} badge={badge} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          {prefix && <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-meta font-medium text-slate">{prefix}</span>}
          <input
            ref={ref}
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            required={required}
            className={cn(controlCls(invalid), 'h-11', prefix && 'pl-12')}
            {...rest}
          />
        </div>
      )}
    </FieldShell>
  );
});

export function PasswordField(props: Omit<InputProps, 'type'>) {
  const { d } = useI18n();
  const [show, setShow] = useState(false);
  const { label, hint, error, required, badge, className, ...rest } = props;
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} badge={badge} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <input
            id={id}
            type={show ? 'text' : 'password'}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            required={required}
            className={cn(controlCls(invalid), 'h-11 pr-11')}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-1 my-1 flex w-9 items-center justify-center rounded-md text-slate hover:bg-mist hover:text-ink"
            aria-label={show ? d.auth.hidePassword : d.auth.showPassword}
            aria-pressed={show}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      )}
    </FieldShell>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  badge?: ReactNode;
  placeholder?: string;
  options: { value: string; label: string }[];
};

export function SelectField({ label, hint, error, required, badge, placeholder, options, className, ...rest }: SelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} badge={badge} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <select
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            required={required}
            className={cn(controlCls(invalid), 'h-11 appearance-none pr-10', !rest.value && 'text-slate')}
            {...rest}
          >
            {placeholder !== undefined && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value} className="text-ink">
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden />
        </div>
      )}
    </FieldShell>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: ReactNode; hint?: ReactNode; error?: string; badge?: ReactNode };

export function TextareaField({ label, hint, error, required, badge, className, rows = 4, ...rest }: TextareaProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} badge={badge} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={cn(controlCls(invalid), 'py-2.5 leading-relaxed')}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

/** Radio options shown as selectable tiles. Arrow keys move between options (native radio behaviour). */
export function ChoiceGroup({
  legend,
  name,
  value,
  onChange,
  options,
  error,
  required,
  columns = 2,
  hint,
}: {
  legend: ReactNode;
  name: string;
  value: string | undefined;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  columns?: 2 | 3 | 4;
  hint?: ReactNode;
}) {
  const errId = useId();
  const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[columns];
  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={error ? errId : undefined} aria-invalid={!!error || undefined}>
      <legend className="mb-1 text-body font-semibold text-ink">
        {legend}
        {required && <span className="ml-0.5 text-bad" aria-hidden>*</span>}
      </legend>
      {hint && <p className="-mt-1 mb-1 text-meta text-slate">{hint}</p>}
      <div className={cn('grid grid-cols-1 gap-2', cols)}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                'group relative flex min-h-[48px] cursor-pointer items-center gap-3 rounded-control border px-3.5 py-2.5 text-body transition-[border-color,background-color,box-shadow] duration-150',
                checked ? 'border-brand bg-brand-soft/60 text-ink shadow-[inset_0_0_0_1px_rgb(var(--brand))]' : 'border-line bg-surface hover:border-slate/40',
                'has-[:focus-visible]:shadow-focus',
              )}
            >
              <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} className="peer sr-only" />
              <span
                aria-hidden
                className={cn(
                  'flex h-4 w-4 flex-none items-center justify-center rounded-full border transition-colors',
                  checked ? 'border-brand bg-brand' : 'border-slate/50 bg-white',
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full bg-white transition-transform', checked ? 'scale-100' : 'scale-0')} />
              </span>
              <span className="font-medium">{o.label}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errId} className="flex items-center gap-1.5 text-meta text-bad" role="alert">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-10 flex-none items-center rounded-full transition-colors duration-200 disabled:opacity-50',
        checked ? 'bg-brand' : 'bg-slate/30',
      )}
    >
      <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
    </button>
  );
}
