# Environment setup (production hardening)

This document lists **required** and **recommended** variables for `apps/web` and how to validate them before production.

## Required (production)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (TLS for remote hosts). |
| `NEXT_PUBLIC_ENV` | `production` (or `staging` for staging). Drives client-visible env and server guards. |
| Session / auth secrets | Password hashing, JWT/session signing — see `lib/auth` and `app/api/auth/*` for actual names. |
| `CRON_SECRET` | Protects cron/internal routes (`Authorization: Bearer ...`). |

## Strongly recommended

| Variable | Purpose |
|----------|---------|
| `STRIPE_*` | Payment provider keys (use **live** keys only in production). |
| Storage (S3, etc.) | Bucket and credentials for document uploads. |
| Email (`RESEND_*` or similar) | Transactional email. |

## Operational

| Variable | Purpose |
|----------|---------|
| `BACKUP_DIR` | Optional path for `npm run backup:db` output. |
| `LOG_VERBOSE` | Set to `1` only for short-lived debug; **omit** in production for normal logs. |

## Demo / debug flags

| Variable | Production rule |
|----------|-----------------|
| `DEMO_MODE` / `NEXT_PUBLIC_DEMO_MODE` | **Must be off** in production unless you intentionally run a demo deployment. |
| `NEXT_PUBLIC_ENV` | **Not** `development` when deployed. |
| `NEXT_PUBLIC_SIGNUP_ENABLED` | Set to `1` to show **Sign up** on the marketing navbar (optional). |

## Validation checklist

- [ ] **No** missing required variables in the production host (CI/CD or dashboard).
- [ ] **No** test/dev Stripe keys (`sk_test_`) in production.
- [ ] **No** default or weak `CRON_SECRET`.
- [ ] `DATABASE_URL` uses **TLS** and **least-privilege** DB user.
- [ ] `NEXT_PUBLIC_*` values reviewed for secrets (they are **visible** in the client bundle).

## Cookies and auth

- Session cookies use **`httpOnly`** where appropriate (`lib/auth/session.ts`).
- **`secure`** cookies for non-local builds (`isSecureCookieContext()`).
- **`sameSite`** defaults to `lax` for session cookies.
- **No** sensitive payloads in client-readable cookies (role cookie is a non-sensitive routing hint; review if tightening).

## See also

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
