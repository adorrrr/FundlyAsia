# Fundly Backend API (PHP 8.1+ & MySQL 8.0+ / MariaDB 10.4+)

Production-ready backend API for Fundly — SME financing-readiness and Masterclass education platform in Bangladesh.

Built with native PHP 8.1+, PDO, strict types, parameterized SQL queries, secure session management, rate limiting, and MySQL `utf8mb4`.

---

## 1. Architecture & Capabilities

The backend provides complete database persistence and REST API endpoints for:
1. **Masterclasses & Speakers**: Public catalog, upcoming/past sorting, draft restrictions, reversible masterclass archiving (hidden from public listings/details and closed to new registrations), speaker profiles, photo/cover uploads, delete checks with 409 prevention when registrations exist.
2. **Admin Authentication & RBAC**: Database-verified credentials, bcrypt password hashing, 15-minute brute-force throttle, HttpOnly session cookies, CSRF protection via custom header check (`X-Requested-With: XMLHttpRequest`), audit logging.
3. **SME Authentication**: SME registration, 6-digit OTP verification with 10-minute expiry and attempt limit, login/logout, forgot password, tokenized password reset.
4. **Business Profiles**: Multi-field SME business profiles (registration info, trade license, TIN, annual revenue, bank account status, debt history) linked 1:1 with SME owner.
5. **Masterclass Registrations**: Atomic transactional registration with unique `FL-XXXXXX` confirmation codes, duplicate registration prevention, capacity and deadline enforcement.
6. **Payment Scaffolding (bKash)**: Server-side payment record creation, merchant callback validation, transaction ID recording, automatic status transition to `paid`.
7. **Readiness Assessment & Scoring Engine**:
   - 20 bilingual questions mapped to 6 weighted categories:
     - Financial Health: 25%
     - Documentation: 20%
     - Compliance: 15%
     - Banking History: 15%
     - Funding Preparation: 15%
     - Debt Capacity: 10%
   - Server-side score computation (0–100) and readiness band categorization (`low`, `needs_improvement`, `moderate`, `stronger`).
   - Priority gap identification and actionable recommendation engine.
8. **Admin Operations & Dashboard**:
   - Platform metrics (total SMEs, registrations, revenue, assessments completed).
   - SME directory with detailed registration and assessment history.
   - Registration roster and status updates.
   - Dynamic scoring rules and question weight configuration.

---

## 2. Directory Structure

```
backend/
├── .env.example              # Environment variables template
├── database/
│   ├── migrations/
│   │   ├── 001_core.sql      # Core tables (admin_users, masterclasses, speakers, etc.)
│   │   ├── 002_sme_platform.sql # Platform tables (users, business_profiles, registrations, payments, questions, assessments, results, scoring_rules)
│   │   └── 007_masterclass_archiving.sql # Reversible masterclass archive flag
│   ├── migrate.php           # Idempotent migration runner
│   ├── seed_admin.php        # Admin creation/reset utility
│   └── seed_platform.php     # Seeds 6 scoring categories & 20 bilingual questions
├── public/
│   ├── index.php             # Front controller
│   ├── .htaccess             # Apache rewrite rules & security headers
│   └── uploads/              # Uploaded media directory
├── routes/
│   └── api.php               # Route registry
├── src/
│   ├── Controllers/
│   │   └── Controllers.php   # Masterclass, Speaker, SME Auth, Profile, Registration, Payment, Eligibility, Admin controllers
│   ├── Repositories/
│   │   └── Repositories.php  # Database access repositories
│   └── Support/
│       ├── Auth.php          # Session, password hashing, OTP, rate limiting, audit
│       ├── Db.php            # PDO singleton (MySQL / SQLite fallback for testing)
│       ├── Env.php           # Lightweight .env parser
│       ├── HttpException.php # Structured API error exceptions
│       ├── Response.php      # JSON response formatter
│       └── Validator.php     # Server-side validation rules
└── tests/
    ├── api_test.php          # 28 core masterclass/speaker/admin API tests
    ├── full_api_test.php     # 27 comprehensive end-to-end platform tests
    └── clear_throttle.php    # Test helper to clear throttles and ensure test credentials
```

---

## 3. Getting Started

### Prerequisites
- PHP 8.1+ with extensions: `pdo_mysql`, `pdo_sqlite`, `curl`, `mbstring`, `fileinfo`.
- MySQL 8.0+ or MariaDB 10.4+.

### Installation
1. Configure Environment:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env` with your MySQL database credentials:
   ```ini
   APP_ENV=local
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=fundly
   DB_USER=root
   DB_PASS=
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   UPLOAD_PUBLIC_URL=http://localhost:5173/api/uploads
   ```

2. Run Database Migrations:
   ```bash
   php backend/database/migrate.php
   ```

3. Seed Admin and Platform Data:
   ```bash
   ADMIN_EMAIL=admin@fundly.asia ADMIN_PASSWORD='super-secure-admin-pass-2026' php backend/database/seed_admin.php
   php backend/database/seed_platform.php
   ```

4. Start Local Backend Server:
   ```bash
   php -S 127.0.0.1:8080 -t backend/public backend/public/index.php
   ```

5. Connect Frontend:
   In root `.env` or `.env.local`:
   ```ini
   VITE_DATA_MODE=api
   VITE_API_BASE_URL=/api
   ```
   Run the Vite frontend:
   ```bash
   npm run dev
   ```
   Vite proxies `/api/*` to `http://127.0.0.1:8080/*`.

---

## 4. API Endpoints Reference

### Public
- `GET /questions` — List active eligibility questions
- `GET /masterclasses` — List published masterclasses (upcoming & past)
- `GET /masterclasses/{id|slug}` — Masterclass detail
- `GET /speakers` — List speakers

### SME Authentication
- `POST /auth/signup` — Create SME account & dispatch OTP
- `POST /auth/login` — SME login
- `POST /auth/logout` — Invalidate session
- `GET /auth/me` — Current authenticated SME
- `POST /auth/otp/verify` — Verify email OTP
- `POST /auth/otp/resend` — Generate new OTP
- `POST /auth/password/forgot` — Request password reset token
- `POST /auth/password/reset` — Reset password with token

### Business Profiles
- `GET /business-profile` — Fetch SME owner's business profile
- `POST /business-profile` — Upsert SME business profile

### Registrations & Payments
- `GET /registrations` — List current SME's registrations
- `GET /registrations/{id}` — Registration details
- `POST /registrations` — Register for masterclass
- `POST /payments/create` — Initialize bKash payment
- `POST /payments/verify` — Verify payment execution callback

### Readiness Assessment
- `GET /assessments/current` — Current draft assessment
- `POST /assessments/save` — Save answers in progress
- `POST /assessments/submit` — Submit assessment & calculate score
- `GET /assessments/result` — Get latest readiness result

### Admin (Session Cookie Required)
- `POST /auth/admin/login` — Administrator login
- `GET /auth/admin/me` — Administrator identity
- `GET /admin/dashboard` — Platform overview metrics
- `GET|POST /admin/masterclasses` — List / create masterclasses
- `GET|PUT|DELETE /admin/masterclasses/{id}` — Manage masterclass
- `PATCH /admin/masterclasses/{id}/status` — Change status
- `PATCH /admin/masterclasses/{id}/archive` — Archive or restore a masterclass (`{"archived": true|false}`)
- `POST|PUT /admin/speakers` — Manage speakers
- `POST /admin/uploads` — Upload image asset
- `GET /admin/smes` — List all registered SMEs
- `GET /admin/smes/{id}` — Detailed SME view
- `GET /admin/registrations` — List all registrations
- `PATCH /admin/registrations/{id}/status` — Update attendance/cancellation
- `GET /admin/results` — List all assessment results
- `GET|PUT /admin/scoring-rules` — Read or update category weights

---

## 5. Automated Tests

Run the full automated test suites:
```bash
# 28 core masterclass, speaker, upload and admin tests:
php backend/tests/api_test.php

# 27 platform integration tests (SME Auth, Profile, Registration, bKash, Scoring Engine, Admin):
php backend/tests/full_api_test.php
```
Both test suites run against the live MySQL server and verify real responses, error states, and database side effects.
