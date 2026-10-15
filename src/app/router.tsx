import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Outlet, useRouteError } from 'react-router-dom';
import PublicLayout from '@/layouts/PublicLayout';
import { GuestOnly, RequireAdmin, RequireSme } from './guards';
import { ScrollManager } from './ScrollManager';
import { LoadingBlock, ErrorState } from '@/components/ui/Feedback';

const AuthLayout = lazy(() => import('@/layouts/AuthLayout'));
const SMELayout = lazy(() => import('@/layouts/SMELayout'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));

// Public
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const MasterclassesPage = lazy(() => import('@/pages/public/MasterclassesPage'));
const MasterclassDetailPage = lazy(() => import('@/pages/public/MasterclassDetailPage'));
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'));
// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const AdminLoginPage = lazy(() => import('@/pages/auth/AdminLoginPage'));
// SME
const OnboardingPage = lazy(() => import('@/pages/sme/OnboardingPage'));
const DashboardPage = lazy(() => import('@/pages/sme/DashboardPage'));
const BusinessProfilePage = lazy(() => import('@/pages/sme/BusinessProfilePage'));
const MyRegistrationsPage = lazy(() => import('@/pages/sme/MyRegistrationsPage'));
const RegistrationDetailPage = lazy(() => import('@/pages/sme/RegistrationDetailPage'));
const RegisterPage = lazy(() => import('@/pages/sme/RegisterPage'));
const PaymentPage = lazy(() => import('@/pages/sme/PaymentPage'));
const ConfirmationPage = lazy(() => import('@/pages/sme/ConfirmationPage'));
const EligibilityPage = lazy(() => import('@/pages/sme/EligibilityPage'));
const EligibilityFlowPage = lazy(() => import('@/pages/sme/EligibilityFlowPage'));
const ResultPage = lazy(() => import('@/pages/sme/ResultPage'));
// Admin
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminSmesPage = lazy(() => import('@/pages/admin/AdminSmesPage'));
const AdminSmeDetailPage = lazy(() => import('@/pages/admin/AdminSmeDetailPage'));
const AdminMasterclassesPage = lazy(() => import('@/pages/admin/AdminMasterclassesPage'));
const AdminMasterclassFormPage = lazy(() => import('@/pages/admin/AdminMasterclassFormPage'));
const AdminSpeakersPage = lazy(() => import('@/pages/admin/AdminSpeakersPage'));
const AdminRegistrationsPage = lazy(() => import('@/pages/admin/AdminRegistrationsPage'));
const AdminQuestionsPage = lazy(() => import('@/pages/admin/AdminQuestionsPage'));
const AdminRulesPage = lazy(() => import('@/pages/admin/AdminRulesPage'));
const AdminResultsPage = lazy(() => import('@/pages/admin/AdminResultsPage'));
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'));

const s = (el: ReactNode) => <Suspense fallback={<LoadingBlock className="shell py-16" />}>{el}</Suspense>;

function Root() {
  return (
    <>
      <ScrollManager />
      <Suspense fallback={<div className="min-h-dvh" />}>
        <Outlet />
      </Suspense>
    </>
  );
}

function RouteError() {
  const err = useRouteError();
  if (import.meta.env.DEV) console.error(err);
  return (
    <div className="shell py-24">
      <ErrorState onRetry={() => window.location.reload()} />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/', element: s(<HomePage />) },
          { path: '/masterclasses', element: s(<MasterclassesPage />) },
          { path: '/masterclasses/:id', element: s(<MasterclassDetailPage />) },
          { path: '/404', element: s(<NotFoundPage />) },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          {
            element: <GuestOnly />,
            children: [
              { path: '/login', element: s(<LoginPage />) },
              { path: '/signup', element: s(<SignupPage />) },
            ],
          },
          { path: '/verify-email', element: s(<VerifyEmailPage />) },
          { path: '/forgot-password', element: s(<ForgotPasswordPage />) },
          { path: '/reset-password', element: s(<ResetPasswordPage />) },
          { path: '/admin/login', element: s(<AdminLoginPage />) },
        ],
      },
      {
        element: <RequireSme allowNoProfile />,
        children: [{ element: <SMELayout />, children: [{ path: '/onboarding/business-profile', element: s(<OnboardingPage />) }] }],
      },
      {
        element: <RequireSme />,
        children: [
          {
            element: <SMELayout />,
            children: [
              { path: '/dashboard', element: s(<DashboardPage />) },
              { path: '/business-profile', element: s(<BusinessProfilePage />) },
              { path: '/my-registrations', element: s(<MyRegistrationsPage />) },
              { path: '/registrations/:id', element: s(<RegistrationDetailPage />) },
              { path: '/registrations/:id/payment', element: s(<PaymentPage />) },
              { path: '/masterclasses/:id/register', element: s(<RegisterPage />) },
              { path: '/masterclasses/:id/confirmation', element: s(<ConfirmationPage />) },
              { path: '/eligibility', element: s(<EligibilityPage />) },
              { path: '/eligibility/:id', element: s(<EligibilityFlowPage />) },
              { path: '/eligibility/:id/result', element: s(<ResultPage />) },
            ],
          },
        ],
      },
      {
        element: <RequireAdmin />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/admin', element: s(<AdminDashboardPage />) },
              { path: '/admin/smes', element: s(<AdminSmesPage />) },
              { path: '/admin/smes/:id', element: s(<AdminSmeDetailPage />) },
              { path: '/admin/masterclasses', element: s(<AdminMasterclassesPage />) },
              { path: '/admin/masterclasses/create', element: s(<AdminMasterclassFormPage />) },
              { path: '/admin/masterclasses/:id/edit', element: s(<AdminMasterclassFormPage />) },
              { path: '/admin/speakers', element: s(<AdminSpeakersPage />) },
              { path: '/admin/registrations', element: s(<AdminRegistrationsPage />) },
              { path: '/admin/eligibility/questions', element: s(<AdminQuestionsPage />) },
              { path: '/admin/eligibility/rules', element: s(<AdminRulesPage />) },
              { path: '/admin/eligibility/results', element: s(<AdminResultsPage />) },
              { path: '/admin/reports', element: s(<AdminReportsPage />) },
            ],
          },
        ],
      },
      {
        element: <PublicLayout />,
        children: [{ path: '*', element: s(<NotFoundPage />) }],
      },
    ],
  },
], { future: { v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true } });
