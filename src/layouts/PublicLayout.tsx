import { SiteHeader } from '@/components/navigation/SiteHeader';
import { SiteFooter } from '@/components/navigation/SiteFooter';
import { AnimatedOutlet } from './PageTransition';
import { SkipLink } from './SkipLink';

export default function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <AnimatedOutlet />
      </main>
      <SiteFooter />
    </div>
  );
}
