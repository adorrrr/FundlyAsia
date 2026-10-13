# Fundly 1.0 - Frontend

Financing-readiness platform for SMEs in Bangladesh. This is a **frontend-only** build: every screen works on in-browser sample data, and nothing is sent to a server.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run lint
```

You need Node 18 or newer. Fonts are self-hosted through `@fontsource-variable` (Hanken Grotesk + Anek Bangla), so nothing loads from Google.

### Try it in preview mode
| Area | How to get in |
|---|---|
| Public site | `/`, `/masterclasses` |
| SME (existing sample business "Jahan Fabrics") | `/login` with any email and an 8+ character password containing a letter and a number |
| SME (new account) | `/signup`, then OTP **123456**, then onboarding |
| Admin | `/admin/login` with any email and an 8+ character password |

Sample data is kept in `sessionStorage` (`fundly.demo.v1`) so a refresh keeps your changes. Close the tab to reset.

### Deploying
This is a static single-page app (SPA). Build it with `npm run build`, then upload the **contents** of `dist/` to your hosting document root (usually `public_html/` in cPanel). Do not upload the source files or the `dist` directory itself. The build includes the Apache `.htaccess` rewrite rule so direct visits and refreshes on routes such as `/admin/login` load the app.

For cPanel:
1. Run `npm run build` locally.
2. Open **File Manager** and go to the domain's document root (usually `public_html/`).
3. Upload the files and folders inside `dist/`, including `.htaccess`. Enable **Show Hidden Files (dotfiles)** in File Manager if `.htaccess` is not visible.
4. Visit your domain and refresh a nested route to confirm the SPA fallback works. If nested routes return 404, ask the host to enable Apache `mod_rewrite` and allow `.htaccess` overrides.

`public/_redirects` (Netlify) and `vercel.json` (Vercel) are also included for those platforms.

**Important:** this build is a frontend preview, not a production service. Authentication (including admin login), data, payments, and scoring are mocked in the browser. Do not use it to store real customer data or rely on its admin routes for access control. A real launch requires a backend with server-side authentication, authorization, persistence, and payment integration.

## Stack
React 18 + Vite 6 + TypeScript, Tailwind CSS 3, React Router 6 (lazy-loaded routes), Framer Motion 11, Lucide icons.

## Structure
```
src/
  app/          router, route guards, scroll/focus manager, AuthProvider
  layouts/      PublicLayout, AuthLayout, SMELayout, AdminLayout
  pages/        public/ auth/ sme/ admin/
  components/   ui/ (design system), forms/, masterclasses/, eligibility/, admin/, navigation/
  i18n/         en.ts + bn.ts dictionaries (typed, key-for-key) and I18nProvider
  services/     one interface per domain + mock implementation; api/client.ts for the real API
  data/         SAMPLE data: masterclasses, question bank, scoring weights/bands, fixtures
  hooks/ utils/ types/ styles/
```

## Design system
- Light mode only. Tokens are CSS variables in `src/styles/index.css`, exposed through `tailwind.config.ts`.
- The brand green comes from the Fundly logo. `brand` (#08804A) is the text-safe shade used for actions; `brand-mark` (#02BE62) is used only for marks and bars.
- The logo was recoloured for light backgrounds (`src/assets/fundly-logo.png`: ink wordmark, green mark).
- Glass (`.glass`) is used only on floating chrome: the nav, the hero panel, sticky action bars, dialogs and toasts. Content surfaces stay solid white.
- Signature motif: the three bars of the "F" mark appear as readiness bars, masterclass covers and the score meter.
- Radii: controls 10px, cards 16px, panels 24px. Motion respects `prefers-reduced-motion`. Scrolling is native, with no scroll hijacking.

---

# Completion report

## Done
**Public:** homepage (carries the content of the approved Lovable site: hero, the challenge, Know·Fix·Prove·Fund, how it works, Loan Lab, next masterclass, readiness preview, who it's for, what Fundly is and isn't, FAQ, CTA, footer with real contact details), masterclass listing (featured, upcoming, past, search) and detail (availability states: open / full / closed / deadline passed / cancelled / completed).

**Auth:** sign up, log in, email OTP (6 boxes, paste, arrow keys, 30s resend countdown), forgot password, reset password, admin login, and a Google sign-in button wired to `authService.googleSignIn()`. That button shows an honest "not connected" notice rather than faking success.

**SME:** onboarding profile, editable business profile with completion meter, dashboard (next step, eligibility, latest result, upcoming classes, my registrations), registration form (prefilled from the profile, with conditional purpose and amount fields), bKash checkout preview (pending / paid / failed / refunded, never asks for a PIN), confirmation (FL-XXXXXX ID, Google Calendar link and .ics download, clearly marked as preview), my registrations, registration detail (pay now, refund request), seven-step readiness check (schema-driven, prefilled, conditional debt questions, progress saved per step, save and exit, review and edit), result page (score, band, strengths, improvements, next step, "Improve my readiness" → Coming soon, bilingual disclaimer), and assessment history.

**Admin:** dashboard (6 KPIs and 2 charts, all labelled as sample), SMEs (search, filters, CSV) and SME detail (profile, registration history, result, answer-change audit timeline), masterclasses (filters, inline status change), create/edit form (bilingual fields, schedule validation, speaker picker or inline new speaker, cover and photo upload with preview and validation, learning points), speakers, registrations (refund queue, attendance, payment correction with a required reason, CSV), question bank (create, edit, preview, active toggle, weight and rule metadata), scoring rules (six weights, must total 100%, reset, bands), results (search, band filter, CSV), and reports (date range, registrations by payment status, checks by band, registration → assessment funnel, CSV each).

**Everywhere:** English/বাংলা switch (persisted), responsive from 320px to wide desktop with no page-level horizontal scroll (checked at 390, 820, 1440 and 1680px), keyboard focus states, accessible dialogs (focus trap, Esc, focus return), skip link, aria-live toasts, and lazy-loaded routes. `tsc`, `eslint --max-warnings=0` and `vite build` all pass.

## What is mocked (and labelled on screen)
- **All data** (`src/data/*`, `src/services/mock/db.ts`). A "Sample data" chip is always visible, and demo records carry a "Demo" badge.
- **Auth:** any valid email and password works, the OTP is always 123456, and no email is sent. Route guards only shape navigation; they are not security.
- **Payments:** `paymentService` has no bKash connection, so the preview buttons simulate each outcome.
- **Scoring:** every submission returns the same **sample result (64)**, flagged as a sample. No scoring formula was written.
- **Uploads:** images stay in the browser as object URLs.
- **Payment-correction reason:** collected and required, but the mock doesn't persist it to an audit log yet.

## Needs the client or backend
1. **Backend:** implement each interface in `src/services/*.ts` against the API with `apiRequest()` and switch the exports in `src/services/index.ts`. Pages don't change.
2. **Auth:** server sessions (httpOnly cookie), email OTP delivery, Google OAuth, password reset tokens, and server-side role checks.
3. **bKash:** create/execute/query on the server with a callback; the browser only redirects to `checkoutUrl`.
4. **Scoring:** the question → scoring-area mapping and the formula need approval with lenders before real scores are shown. Question `weight`/`ruleRef` are deliberately `null`.
5. **Content to confirm:**
   - FAQ answers. The Lovable site only had the questions; the answers here are drafts. The data-safety answer in particular needs the client's real policy.
   - Speaker names, dates and venues in the sample masterclasses.
   - Answer options the brief didn't spell out: repayment status (on time / sometimes late / overdue) and funding timeline.
   - "Financial records" is asked on the Business Financials step.
6. **How it works:** the brief's three-step version is used. The Lovable site's six-step journey is preserved inside the Know · Fix · Prove · Fund section, with Fix, Prove and Fund marked "Later release".
