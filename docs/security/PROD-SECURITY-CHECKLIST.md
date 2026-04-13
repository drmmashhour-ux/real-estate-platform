# Production security checklist (LECIPM)

Use this before go-live and after material infra changes.

**Auth model (cookies vs JWT):** see [`API-AUTHENTICATION.md`](./API-AUTHENTICATION.md).

**At-a-glance (code vs ops):** [`SECURITY-POSTURE-SUMMARY.md`](./SECURITY-POSTURE-SUMMARY.md).

## Database TLS

- [ ] Non-local `DATABASE_URL` includes **`sslmode=require`** (or `verify-full` / `verify-ca`) or `ssl=true` in the query string. Local `localhost` / `127.0.0.1` may omit it.
- [ ] Optional strict boot: set **`REQUIRE_DATABASE_SSL_IN_URL=1`** with production — startup fails if a remote URL lacks explicit TLS params (`lib/db/database-url-ssl.ts`).
- [ ] **Network:** In Neon / RDS / Supabase, keep the instance **private** or IP-allowlisted where possible; the app cannot replace firewall rules.

## Identity & access

- [ ] `DATABASE_URL` uses a **pooled** Neon host when on serverless (`-pooler` in hostname recommended).
- [ ] Database role is **least privilege** (no superuser in app URL).
- [ ] `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` match the same Stripe mode (test vs live).
- [ ] `CRON_SECRET` (and similar) are long random values; never committed.
- [ ] `FAIL_LAUNCH_ON_MISSING_ENV=1` or `STRICT_LAUNCH_ENV=1` enabled if you want boot to fail on missing critical env (see `lib/env/production.ts`).
- [ ] Admin UI: only `ADMIN` / `ACCOUNTANT` roles reach `/admin` (middleware + server layouts).
- [ ] `/api/admin/*` requires session cookie **or** valid `Authorization: Bearer <CRON_SECRET>` for cron-only routes.

## Sessions & cookies

- [ ] Session cookie (`lecipm_guest_id`) is **httpOnly**, **secure** in HTTPS contexts, **SameSite=Lax** (see `lib/auth/session.ts`).
- [ ] Hub role cookie is non-httpOnly by design for Edge middleware; **never** trust it alone for authorization—always re-check Prisma role in API handlers.

## API & abuse

- [ ] High-risk routes use **`checkRateLimitDistributed`** or **`gateDistributedRateLimit`** (auth login/register, contact, waitlist, Immo contact, buyer contact-listing, password reset — falls back to in-memory if `REDIS_URL` unset).
- [ ] Set **`REDIS_URL`** (e.g. Upstash) so limits are **shared** across Vercel isolates.
- [ ] Optional abuse cooldown: **`RATE_LIMIT_IP_BLOCK=1`** + **`RATE_LIMIT_BLOCK_SECONDS`** (default 900) — after a 429 on login/register, Redis can short-block a hashed IP fingerprint.
- [ ] Other routes still use `checkRateLimit` where not yet migrated; plan Redis for those at scale.
- [ ] Webhooks use **raw body** and `constructEvent` with the correct secret (`app/api/stripe/webhook/route.ts`).
- [ ] No stack traces or internal paths in JSON error bodies in production (`lib/security/api-error.ts`).

## Uploads

- [ ] Image uploads: type + size enforced (`lib/security/upload-policy.ts`, BNHub listing media).
- [ ] Verification PDFs: size cap in `document-storage.ts`.
- [ ] Malware scan: configure **`CLAMAV_HOST`** and/or **`MALWARE_SCAN_WEBHOOK_URL`** (see `docs/security/MALWARE-SCANNING.md`). Optional **`MALWARE_SCAN_REQUIRED=1`** to block uploads if neither is configured.

## Headers & browser

- [ ] `next.config.ts` sets HSTS (prod), `X-Frame-Options`, **`X-XSS-Protection: 0`** (disables legacy XSS filter), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP **`frame-ancestors 'self'`** (`lib/security/http-security-headers.ts`).
- [ ] **CORS:** First-party cookie APIs assume **same-site / same-origin** by default. Do **not** add broad `Access-Control-Allow-Origin: *` on session-authenticated routes. For partner or mobile APIs, use a **dedicated** origin allowlist + JWT/API keys (see `API-AUTHENTICATION.md`).
- [ ] Full **CSP** with nonces: follow-up (inline scripts in Next.js need careful tuning). Consider CSP Report-Only in staging first.

## Secrets in repo

- [ ] Pre-commit guard blocks obvious secret patterns (`scripts/git/guard-staged.mjs`).
- [ ] No `.env` with real secrets committed; use Vercel / Doppler / 1Password.

## Monitoring

- [ ] `/api/ready` monitored (DB + critical deps).
- [ ] Alert on spikes of **401 / 403 / 429 / 500** (see `INCIDENT-RESPONSE.md`).
- [ ] **Sentry:** set **`SENTRY_DSN`** (server/edge) and **`NEXT_PUBLIC_SENTRY_DSN`** (browser). `@sentry/nextjs` is installed; init lives in `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation-client.ts` (loaded via Next instrumentation).
- [ ] Ship stdout logs to your provider; grep for **`lecipm_security`** JSON lines from `lib/observability/security-events.ts` (login failures, rate limits).

## Privacy

- [ ] Logs avoid raw emails/phones where possible; use hashing or last-4 style in debug.
- [ ] Document data subject requests (export/delete) process in privacy policy / support.
