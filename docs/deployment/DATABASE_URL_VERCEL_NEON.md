# Set `DATABASE_URL` on Vercel (Neon or Vercel Postgres)

Use this to finish **database setup** for `apps/web` when Postgres is hosted on **Neon** or **Vercel Storage → Postgres**.

## Vercel Postgres (no separate Neon project)

If you create a database in the Vercel dashboard, Vercel injects **`POSTGRES_PRISMA_URL`** (and **`POSTGRES_URL`**). This app copies those into **`DATABASE_URL`** automatically when `DATABASE_URL` is missing or still uses the **`@HOST`** template (`lib/db/resolve-database-url.ts`).

You may still set **`DATABASE_URL`** explicitly to the same value if you prefer; either works.

---

## Neon (external)

Use the sections below when Postgres is hosted on **Neon** (not Vercel Storage).

## 1. Copy the connection string from Neon

1. Open the [Neon Console](https://console.neon.tech) → your project → **Connection details**.
2. Choose the **pooled** connection string if you deploy to **Vercel serverless** (hostname often contains `-pooler`).
3. Ensure the URL includes TLS for non-local use, e.g.:

   `postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`

   - URL-encode special characters in the password.
   - If Neon adds `channel_binding=require` and Prisma fails, the app strips `channel_binding` at runtime (`lib/db/normalize-database-url.ts`); you can also remove it in the dashboard string.

## 2. Add or update the variable in Vercel

1. [Vercel Dashboard](https://vercel.com) → your project (e.g. production app for LECIPM).
2. **Settings** → **Environment Variables**.
3. **Key:** `DATABASE_URL`  
   **Value:** paste the full Neon URI (with `sslmode=require` or stricter).
4. Apply to **Production** (and **Preview** if previews should hit a real DB).
5. **Save**, then **Redeploy** the latest deployment (or push a commit) so serverless functions pick up the new value.

Optional hardening (see `docs/security/PROD-SECURITY-CHECKLIST.md`):

- `REQUIRE_DATABASE_SSL_IN_URL=1` — fails boot in production if a remote URL omits explicit TLS query params.

## 3. Run migrations (once per database)

On an empty or new Neon database, from CI or your machine (with `DATABASE_URL` pointing at Neon):

```bash
cd apps/web
pnpm exec prisma migrate deploy --schema=./prisma/schema.prisma
```

Use a **direct** (non-pooler) URL for migrations if Neon recommends it for DDL; use the **pooled** URL for the Vercel app runtime.

## 4. Verify connectivity

After deploy:

```bash
curl -sS "https://YOUR_DOMAIN/api/ready" | jq .
```

Replace `YOUR_DOMAIN` with your production host (e.g. `app.lecipm.com`).

**Healthy example** (HTTP **200**): the body includes at least:

| Field | Expected |
|-------|----------|
| `ok` | `true` |
| `ready` | `true` |
| `status` | `"ok"` |
| `db` | `"ok"` |
| `dbTargetHost` | Neon host (e.g. `ep-....neon.tech:5432` or pooler host) |
| `env` | Usually `"production"` on Vercel |

The live handler returns **additional** safe fields (`dbHostKind`, `checks`, `time`, masked `dbUrlPreview`, etc.) — see `app/api/ready/route.ts`.

**Unhealthy** (HTTP **503**): `ok` / `ready` are `false`, `db` may be `"failed"`. Check Vercel logs for `api_ready_db_failure` and confirm `DATABASE_URL` has no typos and the DB accepts connections from Vercel.

### Common mistake: hostname is literally `HOST`

If logs or Prisma say **`Can't reach database server at HOST:5432`**, `DATABASE_URL` is still a **template** (e.g. `...@HOST:5432/...`) instead of Neon’s real host (`ep-....neon.tech`, often with **`-pooler`**). Replace the entire value in Vercel with the string from Neon **Connection details**, then **redeploy**.

After the next deploy, the app fails fast at boot with a clear error if this placeholder is still present (`lib/db/prisma.ts`).

## 5. Related docs

- `docs/deployment/VERCEL_CLI_LINK_AND_DEPLOY.md` — `vercel link`, `env pull`, migrate, deploy from `apps/web`.
- `docs/deployment/VERCEL_PRODUCTION_CHECKLIST.md` — full env table.
- `docs/deployment/API_READY_AND_DATABASE_URL.md` — readiness behavior and troubleshooting.
- `docs/security/PROD-SECURITY-CHECKLIST.md` — TLS and least-privilege DB role.
