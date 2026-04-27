# LECIPM Web — environment and deployment (multi-env)

This app (`apps/web`, **LECIPM**) must not share Vercel projects, database URLs, or auth/payment secrets with the Syria (Darlink) or HadiaLink apps. Cross-copying env blocks between products is a common source of outages and data leaks.

## Vercel and hosting

- **Own Vercel project** for the LECIPM web app (e.g. `lecipm-web`), not the Syria or HadiaLink projects.
- **DATABASE_URL** on that project must point at the LECIPM **production** database only, with `sslmode=require` (or stricter) for non-local hosts. Never a localhost/127.0.0.1 host in production.
- **APP_ID** in production: `lecipm` (optional but recommended) so `pnpm env:check` can catch merged-env mistakes.
- **APP_ENV** in production: `production`, or set **NODE_ENV** = `production` on the host.
- **AUTH** / **SESSION** secrets: unique per Vercel project; do not paste Syria or shared “platform” values unless intentionally shared infrastructure (discouraged).
- **Stripe**: use the LECIPM product account keys and webhooks; do not use Syria or Darlink Stripe live keys in this app.

## Cross-app database rules (enforced in code)

- LECIPM must not use a `DATABASE_URL` that suggests the **Syria / SYBNB** estate (see `assertEnvSafety` in `@repo/db/env-guard` and LECIPM isolation checks). **INVESTOR_DEMO_MODE** must stay `false` on production unless you use a dedicated non-user environment; when `true`, resolve uses **STAGING_DATABASE_URL** only (see `scripts/resolve-env-db.js`).
- Syria must not use a URL that contains **lecipm** in the DSN. Never copy Syria `.env` into LECIPM or vice versa.

## Local development

- Prefer **APP_ENV=development** and a local Postgres, or `DEV_DATABASE_URL`, then run `pnpm env:resolve` and `pnpm env:check` (or `pnpm dev:safe`). See root `.env.development.example`.

## Checklist before go-live

- [ ] Vercel project is the LECIPM one only.  
- [ ] `DATABASE_URL` is the managed production URL with TLS in the string.  
- [ ] `STRIPE_*` and other money-moving keys are LECIPM-only.  
- [ ] No Syria/Darlink-only variables required for this app are missing or swapped.

See also: `../../../packages/db/src/env-guard.ts`, `../scripts/resolve-env-db.js`, and `../scripts/check-env.ts`.
