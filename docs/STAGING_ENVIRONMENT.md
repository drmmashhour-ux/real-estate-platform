# Staging & demo environments

Use **two deployments** (e.g. two Vercel projects) with **separate** Postgres databases and **separate** API keys. No shared data.

## 1. Environment variables

| Variable | Production | Staging |
|----------|------------|---------|
| `NEXT_PUBLIC_ENV` | `production` | `staging` |
| `NEXT_PUBLIC_APP_URL` | `https://app.yourdomain.com` | `https://staging.yourdomain.com` |
| `DATABASE_URL` | Production Supabase/Neon URL | **Different** staging DB only |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Live (or omit) | **Test** keys (`sk_test_` / `pk_test_`) |
| `DEMO_MODE` | unset / `false` | optional `true` to mock email + disable Stripe client |
| `NEXT_PUBLIC_DEMO_MODE` | unset | optional `1` — client banner hint |
| `NEXT_PUBLIC_STAGING_REQUIRE_LOGIN` | unset | optional `1` — page routes require sign-in (see middleware) |
| `NEXT_PUBLIC_STAGING_ROLE_GATE` | unset | optional `1` — only allowed roles (cookie) |
| `NEXT_PUBLIC_STAGING_ALLOWED_ROLES` | unset | default `USER,CLIENT,TESTER,ADMIN,ACCOUNTANT` |
| `STAGING_DEMO_LOGIN` | unset | `1` on staging to enable **Login as Demo User** |
| `NEXT_PUBLIC_SHOW_STAGING_DEMO_LOGIN` | unset | `1` on staging to show the button |
| `DEMO_LOGIN_EMAIL` | unset | optional override (default `demo@platform.com`) |

Staging banner and `robots.txt` disallow apply when `NEXT_PUBLIC_ENV=staging`.

## 2. Authentication & roles

The app uses **cookie sessions** (`lecipm_guest_id`) + **role cookie** (`hub_user_role`) set on login. Roles are stored in Postgres (`User.role`).

- **admin** → `ADMIN`
- **client** → `USER` or `CLIENT`
- **tester** → `TESTER` (staging/UAT)

Optional middleware (only when `NEXT_PUBLIC_ENV=staging`):

- `NEXT_PUBLIC_STAGING_REQUIRE_LOGIN=1` — unauthenticated users are redirected to `/auth/login` (API routes are not blocked here).
- `NEXT_PUBLIC_STAGING_ROLE_GATE=1` — signed-in users whose role is not in `NEXT_PUBLIC_STAGING_ALLOWED_ROLES` are sent to `/auth/staging-restricted`.

## 3. Demo accounts

After `npm run seed` in `apps/web`:

| Email | Password | Role |
|-------|----------|------|
| `demo@platform.com` | `Demo123!` | `TESTER` |

One-click demo (no password): enable `STAGING_DEMO_LOGIN=1` and `NEXT_PUBLIC_SHOW_STAGING_DEMO_LOGIN=1`, then use **Login as Demo User** on `/auth/login`.

## 4. Deploy & seed

1. Create a **new** Postgres database for staging.
2. Set `DATABASE_URL` in the staging Vercel project.
3. Run migrations: `cd apps/web && npx prisma migrate deploy`
4. Seed: `npm run seed` (from a secure shell with staging `DATABASE_URL`).

Do **not** run seed automatically on every Vercel deploy from the build step (slow, fragile). Prefer a manual or CI job after deploy.

## 5. Safe mode (`DEMO_MODE`)

When `DEMO_MODE=true` (server):

- Outbound email is logged only (`lib/email/send.ts`).
- Stripe client is disabled (`getStripe()` returns `null`).
- **All API mutations** are blocked by **middleware** except the [allowlist](DEMO_MODE_API_ROUTES.md) (login, logout, demo login, admin generate-user, feedback, etc.). See **[DEMO_MODE_API_ROUTES.md](./DEMO_MODE_API_ROUTES.md)**.
- Optional per-route: `blockIfDemoWrite(request)` from `lib/demo-mode-api.ts`.

## 6. Admin: `/admin/demo`

- **Generate test user** — creates a `TESTER` with a random password (shown once). Blocked when `DEMO_MODE` is on.
- **Reset data** — run `prisma migrate deploy` + `npm run seed` locally/CI against the staging DB (no serverless “reset” button).

## 7. Supabase Row Level Security (RLS)

This app uses **Prisma** with a direct connection string. RLS policies apply only if you connect as a role that is subject to RLS (not the Supabase service role). Typical Prisma setups use a **single DB user**; for strict RLS you’d use Supabase Auth JWT + policies — that is a larger migration than this document. Keep **staging and production `DATABASE_URL` values separate** so staging never touches production data.

## 8. Optional: GitHub Action to seed staging

Add a workflow triggered manually that sets `DATABASE_URL` from secrets and runs `npx prisma migrate deploy && npm run seed` in `apps/web`.

## 9. Daily reset & demo analytics

See **[DEMO_RESET_AND_ANALYTICS.md](./DEMO_RESET_AND_ANALYTICS.md)** (`vercel.json` cron, `CRON_SECRET`, `DemoEvent`, `/admin/demo`).
