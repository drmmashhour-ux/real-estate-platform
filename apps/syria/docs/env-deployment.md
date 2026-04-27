# Syria (Hadiah Link / SYBNB) app — environment and deployment

The Syria app (`@lecipm/syria`) is a **separate product** from the Canada LECIPM `apps/web` app. Use a **dedicated** Vercel project, database, and secrets. **Never** import or copy the LECIPM / Canada `apps/web` Vercel environment as a block into this project (or the reverse).

## Vercel project (SYBNB-6)

| Setting | Value |
|--------|--------|
| **Vercel project name** | `lecipm-syria` (recommended) |
| **Root directory** | `apps/syria` (monorepo) |
| **Build** | From repo: `pnpm build:syria` or `pnpm --filter @lecipm/syria build` (see `vercel.json` + monorepo `installCommand`) |
| **Production env file (template)** | `apps/syria/.env.production.example` — copy to a **local** secret `.env.production` (gitignored) or configure only in Vercel. |

**Domains (pick one; both stay isolated from Canada):**

- **Option A:** `syria.lecipm.com` (subdomain)  
- **Option B:** e.g. `sybnb.com` (future)  

Canada (`apps/web`) and Syria use **different hostnames** and **different Vercel projects** → the browser does **not** share auth cookies (host-only cookies) or session rows (different DBs).

## Vercel and hosting

- **Separate Vercel project** from LECIPM / `apps/web` (see `lecipm-syria` above).
- **Database** — create a **new** Postgres (or host) and set **`SYRIA_DATABASE_URL` + `DATABASE_URL`** to that same DSN, or set **`DATABASE_URL` only** (Prisma). Do **not** reuse the Canada/LECIPM production database. See `SYRIA_DATABASE_URL` in `.env.production.example`.
- **DATABASE_URL** must be the **Syria** staging or production instance as appropriate, with `sslmode=require` (or stricter) for non-local hosts. Production must not use `localhost` or `127.0.0.1`.
- **APP_ID** (recommended in prod): `syria` so `pnpm env:check` can detect wrong merged envs.
- **APP_NAME** in production (if used by your guard): `syria` per existing Darlink requirements.
- **AUTH_SECRET** (or equivalent) must be **unique** to this project — not copied from LECIPM.
- **Stripe and payments**: use keys and webhooks for **this** product; do not reuse LECIPM live keys.

## Cross-app database rules (enforced in code)

- The Syria DSN must **not** contain the token **lecipm** (enforced in `@repo/db/env-guard` and other isolation checks).
- LECIPM must not use Syria/SYBNB database names. Do not “share one DB for both apps” in production.

## Zero-risk staging

- **STAGING_DATABASE_URL** must be a **different** instance than **PRODUCTION_DATABASE_URL** (enforced by `assertEnvSafety` in `@repo/db`).
- Staging should mirror deploy logic but use test/demo data; **INVESTOR_DEMO_MODE** on a hosted preview should pair with a **staging** DSN only (`resolve-env-db.js` forces staging when demo is on).
- **Payment keys**: sandbox or off; never paste production Stripe live keys into staging.

## Investor demo (SYBNB)

- **INVESTOR_DEMO_MODE=true** — UI + flows; **DEMO_**-prefixed data; payments are blocked with `DEMO_MODE_PAYMENT_BLOCKED` in policy.
- Never enable demo against the production database; seed/reset uses `assertEnvSafety` with `demoMode: true`. If **STAGING_DATABASE_URL** is set, **DATABASE_URL** must match it while demo is on, unless **ALLOW_INVESTOR_DEMO_LOCAL_DB=true** with a local Docker DB.

## Local development

- **APP_ID=syria**, **APP_ENV=development**, **INVESTOR_DEMO_MODE=false** by default, and a local or dev DB (e.g. `sybnb_dev`) — see `../.env.development.example`. Run `pnpm dev:safe` for resolve + check + dev server when configured.

## Isolation: cookies, sessions, auth (SYBNB-6)

- **Session cookie** — default name `syria_user_id` (`src/lib/auth.ts`). LECIPM/Canada web uses a different app and is not in this tree. Optional: `SYRIA_AUTH_SESSION_COOKIE` (rotate name only in coordinated deploys).  
- **Locale** — `DARLINK_LOCALE` (see `lib/i18n/config.ts`); set per site in Vercel, no `Domain=.lecipm.com` cookie in our code, so no cross-app leakage on the same TLD.  
- **Data** — all users/rows in the **Syria** database only; no API bridge to the Canada app in this repo.  

## SYBNB feature flags (default production)

- `SYBNB_PAYMENTS_ENABLED=false` — in-app card checkout off.  
- `SYBNB_INSTANT_BOOK_ENABLED=false` — no instant book (`src/config/sybnb.config.ts` + `hostMayEnableSybnbInstantBook`).

## Local / CI build (from monorepo root)

```bash
pnpm install
pnpm build:syria
pnpm start:syria
```

(Or `cd apps/syria && pnpm build && pnpm start`.)

## Checklist

- [ ] Vercel project is **only** Syria (e.g. `lecipm-syria`), not LECIPM/Canada.  
- [ ] `DATABASE_URL` / `SYRIA_DATABASE_URL` point at a **Syria-only** DB (not Canada).  
- [ ] No LECIPM web env block was bulk-imported into this project.  
- [ ] `SYBNB_PAYMENTS_ENABLED` and `SYBNB_INSTANT_BOOK_ENABLED` set as intended.  

See: `../scripts/check-env.ts`, `../scripts/resolve-env-db.js`, and `../../../packages/db/src/env-guard.ts`.
