import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/utils/cn';

export function PageHeader({
  title,
  body,
  actions,
  back,
  className,
  meta,
}: {
  title: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
  className?: string;
  meta?: ReactNode;
}) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0">
        {back && (
          <Link to={back.to} className="mb-3 inline-flex items-center gap-1 text-meta font-medium text-slate hover:text-ink">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {back.label}
          </Link>
        )}
        <h1 className="text-page font-semibold">{title}</h1>
        {body && <p className="mt-2 max-w-prose text-lead text-slate">{body}</p>}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 md:flex-none">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, action, className, as: As = 'h2' }: { children: ReactNode; action?: ReactNode; className?: string; as?: 'h2' | 'h3' }) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <As className="text-card font-semibold">{children}</As>
      {action}
    </div>
  );
}
