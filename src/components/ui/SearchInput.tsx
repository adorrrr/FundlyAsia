import { Search, X } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/utils/cn';
import { useI18n } from '@/i18n/I18nProvider';

export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  const id = useId();
  const { d } = useI18n();
  return (
    <div className={cn('relative w-full sm:max-w-xs', className)}>
      <label htmlFor={id} className="sr-only">{placeholder}</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-control border border-line bg-surface pl-9 pr-9 text-body placeholder:text-slate/70 focus:border-brand focus:shadow-focus focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label={d.common.clearFilters} className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate hover:bg-mist">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/** Pill filter for a small set of options. */
export function FilterPills<V extends string>({ value, onChange, options, label }: { value: V; onChange: (v: V) => void; options: { value: V; label: string }[]; label: string }) {
  return (
    <div role="group" aria-label={label} className="-mx-1 flex min-w-0 max-w-full gap-1 overflow-x-auto px-1 pb-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-8 flex-none whitespace-nowrap rounded-full px-3 text-meta font-semibold transition-colors',
            value === o.value ? 'bg-ink text-white' : 'bg-surface text-slate shadow-hair hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
