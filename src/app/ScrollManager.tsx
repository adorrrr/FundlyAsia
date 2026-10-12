import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Native-scroll friendly route handling:
 * - new pages start at the top, back/forward keeps the browser's position
 * - #hash links scroll to their section (offset by scroll-padding-top in CSS)
 * - focus moves to <main> so screen readers announce the new page
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  const first = useRef(true);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'auto';
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (!hash) return;
    }
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
        return;
      }
    }
    if (navType !== 'POP') window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    const main = document.getElementById('main');
    main?.focus({ preventScroll: true });
  }, [pathname, hash, navType]);

  return null;
}
