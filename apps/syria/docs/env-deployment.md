# Syria (Hadiah Link / SYBNB) app — environment and deployment

The Syria app (`@lecipm/syria`) is a **separate product** from the Canada LECIPM `apps/web` app. Use a **dedicated** Vercel project, database, and secrets. **Never** import or copy the LECIPM / Canada `apps/web` Vercel environment as a block into this project (or the reverse).

## Vercel project (SYBNB-6)

| Setting | Value |
|--------|--------|
| **Vercel project name** | `lecipm-syria` (recommended) |
| **Root directory** | `apps/syria` (monorepo) |
| **Build** | From repo: `pnpm build:syria` or `pnpm --filter @lecipm/syria build` (`package.json` uses `next build --webpack` — stable Tailwind/CSS vs default Turbopack in Next 16) |
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

## ORDER SYBNB-9 — Deploy & isolate (production)

Manual steps happen in Neon/Supabase/Vercel/DNS — the app code is already scoped to **`apps/syria`** only.

### 1. Vercel project

| | |
|--|--|
| **Project name** | `lecipm-syria` |
| **Root directory** | `apps/syria` |
| **Framework preset** | Next.js (inherits `apps/syria/vercel.json`; install/build run from repo root via `cd ../..`) |

Link the Git repo once; Canada’s `apps/web` project stays separate.

### 2. Database (**new** Postgres)

1. Provision a **new** database for Hadiah Link only (**do not** point at Canada/Lecipm production).
2. In Vercel → **Production** environment:
   - **`DATABASE_URL`** = full connection string to that Syria DB (required by Prisma at runtime).
   - **`SYRIA_DATABASE_URL`** = same string (recommended operator label; must match **`DATABASE_URL`** when both are set — see `scripts/check-env.ts`).

Never paste Canada’s **`DATABASE_URL`** into this project. The **`lecipm`** token guard in **`@repo/db/env-guard`** rejects Canada DSN shapes in Syria builds.

### 3. Env (Syria project only — example)

Configure in **`lecipm-syria`**, not in the Canada web project:

| Variable | Production value |
|----------|-------------------|
| `DATABASE_URL` | Syria Postgres DSN (same physical DB as **`SYRIA_DATABASE_URL`**) |
| `SYRIA_DATABASE_URL` | Same DSN as **`DATABASE_URL`** (optional duplicate for clarity) |
| `SYBNB_PAYMENTS_ENABLED` | `false` |
| `SYBNB_PAYMENT_PROVIDER` | `manual` |
| `APP_ID` | `syria` |
| `APP_ENV` | `production` |

Copy the rest from **`.env.production.example`** (unique **`AUTH_SECRET`**, cron **`CRON_SECRET`**, maps keys, etc.). **Do not bulk-import Canada’s `.env`** into **`lecipm-syria`**.

### 4. Domain

- Prefer **`https://syria.lecipm.com`** → Vercel → Domains → add + DNS `CNAME` / `A` as instructed.
- Or use Vercel’s default `*.vercel.app` until DNS is ready.

### 5. Auth isolation (enforced behavior)

| Concern | How Syria stays isolated |
|--------|---------------------------|
| Cookies | **`syria_user_id`** (or **`SYRIA_AUTH_SESSION_COOKIE`**) — **host-only**, no **`Domain=.lecipm.com`** in `src/lib/auth.ts`. |
| Sessions | Rows live only in **`syriaAppUser`** (Syria **`DATABASE_URL`**). Canada web does not share this schema. |
| Secrets | Separate Vercel project → separate **`AUTH_SECRET`**. |

### 6–7. CI / ops commands (before or after first deploy)

From **monorepo root**:

```bash
pnpm install
pnpm build:syria
pnpm start:syria
```

Migrate against the **Syria** DB (Production URL in shell or `.env.local` pointing at Syria only):

```bash
cd apps/syria && pnpm prisma:deploy
# equivalent: pnpm exec prisma migrate deploy --schema=./prisma/schema.prisma
```

On Vercel, run **`pnpm prisma:deploy`** from a secured job or your machine whenever migrations ship.

### 8. Smoke test (staging or production URL)

Manual checks:

- **Homepage** loads (`/` locale).
- **Create listing** (sell flow after sign-in).
- **SYBNB** booking **request** (no in-app payment when **`SYBNB_PAYMENTS_ENABLED=false`**).
- **Report** listing.
- **`/admin`** (or gated admin hub) reachable for an admin account.

### 9. Acceptance

- Syria deploy is live on **`syria.lecipm.com`** (or Vercel domain).
- **No** Canada data in the Syria DB (fresh migrations + Syria-only ops).
- **Safe** onboarding: payments manual / off per flags above until product allows otherwise.

## ORDER SYBNB-102 — Standalone production deploy (Vercel)

Use a **new** Vercel project (do not reuse `apps/web`):

| Dashboard field | Value |
|-----------------|--------|
| **Project name** | `lecipm-syria` |
| **Root directory** | `apps/syria` |
| **Install command** | *(leave empty to use `apps/syria/vercel.json`)* → runs **`pnpm install`** from monorepo root (`cd ../.. && pnpm install --frozen-lockfile`). |
| **Build command** | *(inherit)* → **`pnpm build`** for Syria via `pnpm --filter @lecipm/syria build`. |

**Production environment variables** (minimum — mirror `.env.production.example` for the rest):

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Syria Postgres DSN (required by Prisma). Must match `SYRIA_DATABASE_URL` when both are set. |
| `SYRIA_DATABASE_URL` | Same DSN as `DATABASE_URL` (recommended operator label). |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary upload/deferred URLs for listings and proofs. |
| `CLOUDINARY_API_KEY` | |
| `CLOUDINARY_API_SECRET` | |
| `CLOUDINARY_LISTINGS_FOLDER` | Default in code: **`sybnb/syria`** — never **`sybnb/listings`** on Syria production (guard). |
| `SYBNB_PAYMENTS_ENABLED` | `false` until PSP rollout. |

**Domain:** add **`syria.lecipm.com`** in Vercel → Domains (DNS `CNAME` to Vercel), or ship first on the default **`*.vercel.app`** hostname.

**CLI:** from the repo, `cd apps/syria && vercel` / `vercel deploy --prod` after linking the project (`vercel link`), or deploy from the Vercel dashboard after connecting Git.

**Acceptance:** homepage loads publicly; browse/listing routes work; API routes (including cron auth where applicable) respond — smoke-test staging/production URLs before announcing.

## ORDER SYBNB-103 — Isolation from Canada platform

Hadiah Link (**`apps/syria`**) must remain a **fully independent** system: no shared database, sessions, cookies across origins, or asset namespaces with LECIPM (**`apps/web`**, Canada).

| Concern | Enforcement |
|--------|-------------|
| **Database** | New Postgres only — **`DATABASE_URL`** / **`SYRIA_DATABASE_URL`** (same DSN). **`@repo/db` `assertEnvSafety`** rejects Syria URLs containing **`lecipm`**. Never reuse Canada production DB. |
| **Auth / sessions** | Prisma models **`SyriaAppUser`** etc. only in Syria schema. Session cookie **`syria_user_id`** (or **`SYRIA_AUTH_SESSION_COOKIE`**) — host-only, httpOnly — see `src/lib/auth.ts`. |
| **API surface** | **`/api/sybnb/*`** and **`/api/listings/*`** are implemented **only** under **`apps/syria/src/app/api/`**. Canada **`apps/web`** does not define **`api/sybnb`** routes; listing APIs there are unrelated LECIPM endpoints on a **different** hostname and deploy. |
| **Media storage** | Default Cloudinary folder **`sybnb/syria`** (proofs: **`sybnb/syria/proofs`**). Production rejects **`CLOUDINARY_LISTINGS_FOLDER=sybnb/listings`** (legacy shared path) — see **`assertSyriaCloudinaryFolderIsolation`** in `src/lib/env/app-isolation.ts`. |
| **Environment files** | Syria production secrets live **only** in the **`lecipm-syria`** Vercel project and/or a **local** **`apps/syria/.env.production`** (gitignored). Do **not** bulk-import **`apps/web`** env into Syria. |

**Acceptance:** no shared user rows with Canada; no cookie/session leakage between deploys; uploads and DB are namespace-separated.

