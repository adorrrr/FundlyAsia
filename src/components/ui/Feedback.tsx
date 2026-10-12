import type { ReactNode } from 'react';
import { AlertTriangle, FlaskConical, Info, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />;
}

export function LoadingBlock({ rows = 3, className }: { rows?: number; className?: string }) {
  const { d } = useI18n();
  return (
    <div className={cn('flex flex-col gap-3', className)} role="status" aria-label={d.common.loading}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={cn('h-16', i === 0 && 'h-24')} />
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, body, action, className }: { icon?: ReactNode; title: ReactNode; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center rounded-card border border-dashed border-line bg-surface/60 px-6 py-10 text-center', className)}>
      {icon && <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-mist text-slate">{icon}</div>}
      <p className="text-card font-semibold text-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-body text-slate">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry, title, body }: { onRetry?: () => void; title?: string; body?: string }) {
  const { d } = useI18n();
  return (
    <div role="alert" className="flex flex-col items-center rounded-card border border-bad/20 bg-bad-soft/40 px-6 py-10 text-center">
      <AlertTriangle className="mb-3 h-6 w-6 text-bad" aria-hidden />
      <p className="text-card font-semibold">{title ?? d.common.errorTitle}</p>
      <p className="mt-1 max-w-sm text-body text-slate">{body ?? d.common.errorBody}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
          {d.common.retry}
        </Button>
      )}
    </div>
  );
}

type NoticeTone = 'info' | 'warn' | 'demo' | 'ok';
export function Notice({ tone = 'info', title, children, className, icon }: { tone?: NoticeTone; title?: ReactNode; children?: ReactNode; className?: string; icon?: ReactNode }) {
  const styles: Record<NoticeTone, string> = {
    info: 'bg-info-soft/60 border-info/15 text-ink',
    warn: 'bg-warn-soft/70 border-warn/20 text-ink',
    demo: 'bg-warn-soft/50 border-warn/30 border-dashed text-ink',
    ok: 'bg-ok-soft/70 border-ok/15 text-ink',
  };
  const Icon = tone === 'demo' ? FlaskConical : tone === 'warn' ? AlertTriangle : Info;
  const iconColor = { info: 'text-info', warn: 'text-warn', demo: 'text-warn', ok: 'text-ok' }[tone];
  return (
    <div className={cn('flex gap-3 rounded-card border px-4 py-3', styles[tone], className)}>
      <span className={cn('mt-0.5 flex-none', iconColor)} aria-hidden>{icon ?? <Icon className="h-4 w-4" />}</span>
      <div className="min-w-0 text-body">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn('text-slate', title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  );
}
