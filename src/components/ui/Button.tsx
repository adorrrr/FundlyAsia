import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'link' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(10_90_54/0.3)] hover:bg-brand-deep disabled:bg-brand/50',
  secondary: 'bg-surface text-ink shadow-hair hover:shadow-lift hover:bg-white disabled:text-slate',
  ghost: 'text-ink hover:bg-mist disabled:text-slate',
  link: 'text-brand underline-offset-4 hover:underline px-0 h-auto',
  danger: 'bg-bad text-white hover:bg-bad/90 disabled:bg-bad/50',
};
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-meta gap-1.5',
  md: 'h-11 px-4 text-body gap-2',
  lg: 'h-12 px-5 text-[0.9875rem] gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  to?: string;
  href?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, to, href, icon, iconRight, full, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  const cls = cn(
    'inline-flex select-none items-center justify-center whitespace-nowrap rounded-control font-semibold transition-[background-color,box-shadow,color,transform] duration-200 ease-out active:scale-[0.985] disabled:cursor-not-allowed disabled:active:scale-100',
    variants[variant],
    variant !== 'link' && sizes[size],
    variant === 'link' && 'text-body gap-1.5',
    full && 'w-full',
    className,
  );
  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      <span className="truncate">{children}</span>
      {!loading && iconRight}
    </>
  );
  if (to && !disabled) return <Link to={to} className={cls}>{content}</Link>;
  if (href && !disabled)
    return (
      <a href={href} className={cls} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
        {content}
      </a>
    );
  return (
    <button ref={ref} type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
});
