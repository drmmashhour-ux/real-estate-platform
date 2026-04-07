# `/api/ready` and database host verification (Vercel + Neon)

The web app readiness route **`GET /api/ready`** is a **real** health check: it runs **`SELECT 1`** against Postgres, validates i18n bundles, and resolves market config. It is **not** a hostname-only debug endpoint.

## Safe fields (no secrets)

The JSON may include:

| Field | Meaning |
|--------|--------|
| **`dbTargetHost`** | Hostname parsed from **`DATABASE_URL`** only (no user/password). From **`getDatabaseHostHint()`**. |
| **`dbHostKind`** | **`neon`** \| **`unknown`** \| **`unset`** — from **`getDbHostKind()`** (hostname from **`DATABASE_URL` only). |
| **`nodeEnv`** | `process.env.NODE_ENV` (e.g. `production`). |

**Never** return or log the full **`DATABASE_URL`** in HTTP responses or generic logs.

## How to read `dbHostKind`

| Value | Meaning |
|--------|--------|
| **`neon`** | Hostname matches **Neon** (`*.neon.tech`) — expected for production on Neon. |
| **`unknown`** | URL is set and parseable, but the host is not Neon (wrong provider, typo, or legacy host). |
| **`unset`** | **`DATABASE_URL`** missing or not parseable as a URL. |

If you set Neon in Vercel but **`dbHostKind`** is not **`neon`**, the runtime is **not** using the Neon connection string you expect. Typical causes:

1. **Wrong Vercel project** — the domain is attached to a different project than the one you edited.
2. **Wrong environment scope** — Production vs Preview vs Development variables differ.
3. **Stale deployment** — redeploy with **Clear build cache** after changing env.
4. **Domain mapping** — **`app.lecipm.com`** points at another project in **Vercel → Domains**.

## Prisma entrypoint (Next.js / `apps/web`)

- **File:** `apps/web/lib/db/prisma.ts`
- **Import:** `@/lib/db` → re-exports this client.
- **Behavior:** When **`DATABASE_URL`** is set, **`PrismaClient`** is constructed with **`datasources.db.url`** set from **`process.env.DATABASE_URL`** (aligned with `schema.prisma`).

## Migrations vs runtime

Runtime Prisma uses **`DATABASE_URL`** only (`schema.prisma` + `lib/db/prisma.ts`). For **`prisma migrate deploy`** against a direct (non-pooler) host, set **`DATABASE_URL`** to that URL in the shell or CI for the command only — do not rely on alternate Vercel vars for the web app.

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

## When `db` is `"failed"`

1. Confirm **`DATABASE_URL`** on the **correct** Vercel project and **Production** scope (see operator checklist above).
2. Check deployment logs for structured lines with **`event":"api_ready_db_failure"`** — includes **`dbErrorKind`**: `auth` \| `network` \| `timeout` \| `schema` \| `unknown` (no credentials).
3. **Auth** → wrong password / user / SSL params; rotate in Neon and update Vercel ([NEON_PROD_ROTATION_CHECKLIST.md](./NEON_PROD_ROTATION_CHECKLIST.md)).
4. **Network / timeout** → Neon project paused, IP allowlist, or transient outage; retry after Neon/Vercel status is green.
5. **Schema** → migrations not applied to this database; run `prisma migrate deploy` against the same Neon URL (from a secure runner, never log the URL).

## Neon vs Supabase (Postgres)

- **Prisma** uses **`DATABASE_URL` only**. For production on Neon, **`dbTargetHost`** should contain **`neon.tech`**.
- **Supabase Auth / Storage** use **`NEXT_PUBLIC_SUPABASE_*`** and **`SUPABASE_SERVICE_ROLE_KEY`** — separate from Postgres; do not remove those when only migrating the database to Neon.

## Implementation notes

- **`GET /api/ready`** runs **`SELECT 1`** with a **small transient retry** (`apps/web/lib/db/with-db-retry.ts`) — not a global query wrapper.
- DB errors are classified in **`apps/web/lib/db/db-error-classification.ts`** for logs only.

## Monitoring and alerting (recommended)

- **Vercel logs / APM**: alert on spikes of **`api_ready_db_failure`** or sustained **`503`** on `/api/ready`.
- **Synthetic checks**: ping `/api/ready` every 1–5 minutes from an external monitor; alert when **`ready`** is not **`true`** or **`db`** is not **`connected`**.
- **Prisma**: alert on elevated **`PrismaClientInitializationError`** or connection errors in serverless function logs.

## Related

- [NEON_PROD_ROTATION_CHECKLIST.md](./NEON_PROD_ROTATION_CHECKLIST.md)
- [AUTOPILOT_ROLLOUT_PLAN.md](../ai/AUTOPILOT_ROLLOUT_PLAN.md)
