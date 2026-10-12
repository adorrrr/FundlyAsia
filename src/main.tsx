import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { router } from '@/app/router';
import { I18nProvider } from '@/i18n/I18nProvider';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import '@fontsource-variable/hanken-grotesk/wght.css';
import '@fontsource-variable/anek-bangla/wght.css';
import '@/styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <I18nProvider>
        <AuthProvider>
          <ToastProvider>
            <RouterProvider router={router} future={{ v7_startTransition: true }} />
          </ToastProvider>
        </AuthProvider>
      </I18nProvider>
    </MotionConfig>
  </StrictMode>,
);
