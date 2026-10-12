import { Link } from 'react-router-dom';
import logo from '@/assets/fundly-logo.png';
import { cn } from '@/utils/cn';

/** Light-background version of the Fundly Asia logo (wordmark recoloured to ink). */
export function Logo({ className, to = '/' }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn('inline-flex items-center rounded-md', className)} aria-label="Fundly — home">
      <img src={logo} alt="Fundly Asia" width={720} height={207} className="h-7 w-auto sm:h-8" />
    </Link>
  );
}
