import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { cn } from '@/utils/cn';
import { AnimatedOutlet } from './PageTransition';
import { SkipLink } from './SkipLink';

export default function SMELayout() {
  const { d } = useI18n();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [loc.pathname]);

  const links = [
    { to: '/dashboard', label: d.nav.dashboard },
    { to: '/eligibility', label: d.nav.eligibility },
    { to: '/my-registrations', label: d.nav.myRegistrations },
    { to: '/masterclasses', label: d.nav.masterclasses },
    { to: '/business-profile', label: d.nav.businessProfile },
  ];
  const onLogout = async () => {
    await logout();
    nav('/');
  };
  const initials = (user?.name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('');

  return (
    <div className="ambient flex min-h-dvh flex-col bg-paper">
      <SkipLink />
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
        <div className="glass mx-auto flex h-[60px] max-w-shell items-center gap-3 rounded-[18px] px-3 pl-4">
          <Logo to="/dashboard" />
          <nav aria-label="Account" className="ml-5 hidden items-center gap-0.5 lg:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn('rounded-full px-3 py-1.5 text-body font-medium transition-colors', isActive ? 'bg-ink text-white' : 'text-slate hover:text-ink')
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <LanguageSwitcher />
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-meta font-bold text-brand-deep" title={user?.name} aria-hidden>
              {initials}
            </span>
            <button onClick={onLogout} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-meta font-semibold text-slate hover:bg-mist hover:text-ink">
              <LogOut className="h-4 w-4" aria-hidden />
              {d.nav.logout}
            </button>
          </div>
          <button
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-control hover:bg-mist lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="sme-nav"
            aria-label={open ? d.common.closeMenu : d.common.openMenu}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.nav
              id="sme-nav"
              aria-label="Account"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="glass mx-auto mt-2 flex max-w-shell flex-col rounded-[18px] p-3 lg:hidden"
            >
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={({ isActive }) => cn('rounded-control px-3 py-3 text-lead font-medium', isActive ? 'bg-mist text-ink' : 'text-ink hover:bg-mist')}>
                  {l.label}
                </NavLink>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-line px-1 pt-3">
                <LanguageSwitcher />
                <button onClick={onLogout} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-meta font-semibold text-slate hover:bg-mist">
                  <LogOut className="h-4 w-4" aria-hidden />
                  {d.nav.logout}
                </button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      <main id="main" tabIndex={-1} className="shell flex-1 py-8 outline-none sm:py-10">
        <AnimatedOutlet />
      </main>
    </div>
  );
}
