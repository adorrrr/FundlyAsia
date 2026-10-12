import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { cn } from '@/utils/cn';

export function SiteHeader() {
  const { d } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();

  useEffect(() => setOpen(false), [loc.pathname, loc.hash]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  const links = [
    { to: '/', label: d.nav.home, end: true },
    { to: '/masterclasses', label: d.nav.masterclasses },
    { to: '/#how', label: d.nav.howItWorks },
    { to: '/#faq', label: d.nav.faq },
  ];
  const home = user?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
      <div
        className={cn(
          'mx-auto flex h-[var(--nav-h)] max-w-shell items-center gap-3 rounded-[20px] px-3 pl-4 transition-[background-color,box-shadow] duration-300 sm:px-4 sm:pl-5',
          scrolled || open ? 'glass' : 'bg-transparent',
        )}
      >
        <Logo />
        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
          {links.map((l) =>
            l.to.includes('#') ? (
              <Link key={l.to} to={l.to} className="rounded-full px-3 py-2 text-body font-medium text-slate transition-colors hover:text-ink">
                {l.label}
              </Link>
            ) : (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => cn('rounded-full px-3 py-2 text-body font-medium transition-colors', isActive && !loc.hash ? 'text-ink' : 'text-slate hover:text-ink')}
              >
                {l.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          {user ? (
            <Button to={home} size="sm" className="h-9 px-4">{d.nav.dashboard}</Button>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm" className="h-9">{d.nav.login}</Button>
              <Button to="/signup" size="sm" className="h-9 px-4">{d.nav.getStarted}</Button>
            </>
          )}
        </div>
        <button
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-control text-ink hover:bg-mist lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? d.common.closeMenu : d.common.openMenu}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass mx-auto mt-2 max-w-shell rounded-[20px] p-3 lg:hidden"
          >
            <nav aria-label="Main" className="flex flex-col">
              {links.map((l) => (
                <Link key={l.to} to={l.to} className="rounded-control px-3 py-3 text-lead font-medium text-ink hover:bg-mist">
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-line px-1 pt-3">
              <LanguageSwitcher />
              <div className="flex gap-2">
                {user ? (
                  <Button to={home} size="sm">{d.nav.dashboard}</Button>
                ) : (
                  <>
                    <Button to="/login" variant="secondary" size="sm">{d.nav.login}</Button>
                    <Button to="/signup" size="sm">{d.nav.getStarted}</Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
