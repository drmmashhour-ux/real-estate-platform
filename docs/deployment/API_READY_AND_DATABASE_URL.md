# `/api/ready` and database host verification (Vercel + Neon)

The web app readiness route **`GET /api/ready`** is a **real** health check: it runs **`SELECT 1`** against Postgres, validates i18n bundles, and resolves market config. It is **not** a hostname-only debug endpoint.

## Safe fields (no secrets)

The JSON may include:

| Field | Meaning |
|--------|--------|
| **`dbTargetHost`** | Hostname parsed from **`DATABASE_URL`** only (no user/password). From **`getDatabaseHostHint()`**. |
| **`dbHostKind`** | **`neon`** \| **`supabase`** \| **`other`** \| **`unset`** — from **`getDbHostKind()`**. |
| **`nodeEnv`** | `process.env.NODE_ENV` (e.g. `production`). |

**Never** return or log the full **`DATABASE_URL`** in HTTP responses or generic logs.

## How to read `dbHostKind`

| Value | Meaning |
|--------|--------|
| **`neon`** | This deployment’s **`DATABASE_URL`** points at a host matching **Neon** (`*.neon.tech`). |
| **`supabase`** | Still using **Supabase Postgres** as the Prisma DB host (`*.supabase.co`), or a pooler hostname that matches that pattern. |
| **`other`** | Another provider (RDS, local, etc.). |
| **`unset`** | **`DATABASE_URL`** missing or not parseable as a URL. |

If you set Neon in Vercel but **`dbHostKind`** is still **`supabase`**, the runtime is **not** using the Neon string you expect. Typical causes:

1. **Wrong Vercel project** — the domain is attached to a different project than the one you edited.
2. **Wrong environment scope** — Production vs Preview vs Development variables differ.
3. **Stale deployment** — redeploy with **Clear build cache** after changing env.
4. **Domain mapping** — **`app.lecipm.com`** points at another project in **Vercel → Domains**.

## Prisma entrypoint (Next.js / `apps/web`)

- **File:** `apps/web/lib/db/prisma.ts`
- **Import:** `@/lib/db` → re-exports this client.
- **Behavior:** When **`DATABASE_URL`** is set, **`PrismaClient`** is constructed with **`datasources.db.url`** set from **`process.env.DATABASE_URL`** (aligned with `schema.prisma`).

## Optional: `DIRECT_URL` in env schema

`apps/web/lib/env.ts` may parse **`DIRECT_URL`** for tooling (e.g. migrations with a non-pooler URL). It is **not** wired into the runtime Prisma client; Prisma still uses **`DATABASE_URL`** only for the web app.

## Operator checklist (manual)

1. **Vercel → Domains → `app.lecipm.com`** — note the **exact project** that serves this host.
2. In **that** project → **Settings → Environment Variables**:
   - Set **`DATABASE_URL`** to your **Neon** connection string (`?sslmode=require`, one line, URL-encoded password if needed).
   - Remove stray DB vars if present: **`POSTGRES_URL`**, **`POSTGRES_PRISMA_URL`**, **`DIRECT_URL`**, **`SHADOW_DATABASE_URL`** (avoid conflicting overrides).
3. **Deployments → Redeploy** with **Clear build cache**.
4. Open **`https://app.lecipm.com/api/ready`** and confirm **`dbHostKind`: `"neon"`** and **`db`: `"connected"`**.

## Expected healthy shape (illustrative)

```json
{
  "ready": true,
  "db": "connected",
  "dbTargetHost": "ep-xxxx.region.aws.neon.tech",
  "dbHostKind": "neon",
  "nodeEnv": "production"
}
```

Additional fields (`checks`, `env`, `time`, etc.) come from the full readiness logic.
