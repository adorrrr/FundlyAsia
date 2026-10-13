import { useEffect, useState, type ComponentType } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, ClipboardCheck, GraduationCap, LayoutDashboard, LogOut, Menu, Mic2, Scale, SquareStack, Ticket, Users, X, ListChecks, ArrowUpRight } from 'lucide-react';
import logo from '@/assets/fundly-logo.png';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { cn } from '@/utils/cn';
import { AnimatedOutlet } from './PageTransition';
import { SkipLink } from './SkipLink';

type Item = { to: string; label: string; icon: ComponentType<{ className?: string }>; end?: boolean; children?: Item[] };

function SidebarNav({ items }: { items: Item[] }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((it) => (
        <li key={it.to}>
          <NavLink
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              cn(
                'flex h-10 items-center gap-3 rounded-control px-3 text-body font-medium transition-colors',
                isActive ? 'bg-surface text-ink shadow-hair' : 'text-slate hover:bg-surface/60 hover:text-ink',
              )
            }
          >
            <it.icon className="h-4 w-4 flex-none" aria-hidden />
            <span className="truncate">{it.label}</span>
          </NavLink>
          {it.children && (
            <ul className="ml-[22px] mt-0.5 flex flex-col gap-0.5 border-l border-line pl-3">
              {it.children.map((c) => (
                <li key={c.to}>
                  <NavLink
                    to={c.to}
                    className={({ isActive }) =>
                      cn('flex h-9 items-center gap-2.5 rounded-control px-2.5 text-meta font-medium transition-colors', isActive ? 'bg-surface text-ink shadow-hair' : 'text-slate hover:text-ink')
                    }
                  >
                    <c.icon className="h-3.5 w-3.5 flex-none" aria-hidden />
                    {c.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function AdminLayout() {
  const { d } = useI18n();
  const a = d.admin.nav;
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [loc.pathname]);

  const items: Item[] = [
    { to: '/admin', label: a.dashboard, icon: LayoutDashboard, end: true },
    { to: '/admin/smes', label: a.smes, icon: Users },
    { to: '/admin/masterclasses', label: a.masterclasses, icon: GraduationCap, children: [{ to: '/admin/speakers', label: a.speakers, icon: Mic2 }] },
    { to: '/admin/registrations', label: a.registrations, icon: Ticket },
    {
      to: '/admin/eligibility/questions',
      label: a.eligibility,
      icon: ClipboardCheck,
      children: [
        { to: '/admin/eligibility/questions', label: a.questions, icon: ListChecks },
        { to: '/admin/eligibility/rules', label: a.rules, icon: Scale },
        { to: '/admin/eligibility/results', label: a.results, icon: SquareStack },
      ],
    },
    { to: '/admin/reports', label: a.reports, icon: BarChart3 },
  ];

  const onLogout = async () => {
    await logout();
    nav('/admin/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 pb-6 pt-1">
        <img src={logo} alt="Fundly Asia" className="h-6 w-auto" />
        <span className="rounded-full bg-ink px-2 py-0.5 text-[0.6875rem] font-bold text-white">{d.admin.panel}</span>
      </div>
      <nav aria-label={d.admin.panel} className="flex-1 overflow-y-auto">
        <SidebarNav items={items} />
      </nav>
      <div className="mt-4 flex flex-col gap-3 border-t border-line px-2 pt-4">
        <LanguageSwitcher className="self-start" />
        <p className="truncate px-1 text-meta text-slate">{user?.email}</p>
        <div className="flex flex-wrap gap-1">
          <Link to="/" className="inline-flex h-9 items-center gap-1.5 rounded-control px-2.5 text-meta font-semibold text-slate hover:bg-surface hover:text-ink">
            <ArrowUpRight className="h-4 w-4" aria-hidden />
            {d.admin.backToSite}
          </Link>
          <button onClick={onLogout} className="inline-flex h-9 items-center gap-1.5 rounded-control px-2.5 text-meta font-semibold text-slate hover:bg-surface hover:text-ink">
            <LogOut className="h-4 w-4" aria-hidden />
            {d.nav.logout}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <SkipLink />
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-mist/50 px-3 py-5 lg:block">{sidebar}</aside>
      <header className="sticky top-0 z-40 px-3 pt-3 lg:hidden">
        <div className="glass flex h-14 items-center justify-between rounded-[16px] pl-4 pr-2">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Fundly Asia" className="h-6 w-auto" />
            <span className="rounded-full bg-ink px-2 py-0.5 text-[0.6875rem] font-bold text-white">{d.admin.panel}</span>
          </div>
          <button onClick={() => setOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-control hover:bg-mist" aria-label={d.common.openMenu} aria-expanded={open}>
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div className="absolute inset-0 bg-ink/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-paper px-3 py-5 shadow-float"
            >
              <button onClick={() => setOpen(false)} className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-control hover:bg-mist" aria-label={d.common.closeMenu}>
                <X className="h-4 w-4" />
              </button>
              {sidebar}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
      <main id="main" tabIndex={-1} className="min-w-0 px-4 py-6 outline-none sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-[1180px]">
          <AnimatedOutlet />
        </div>
      </main>
    </div>
  );
}
