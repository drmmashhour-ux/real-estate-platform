# Vercel CLI — link, env, migrate, deploy (`apps/web`)

Use this when the **Vercel project Root Directory** is **`apps/web`** (see `docs/deployment/GIT_VERCEL_APP_DOMAIN.md`).

## Directory (avoid double `apps/web`)

- **Correct:** repo root is `real-estate-platform`, app lives in **`real-estate-platform/apps/web`** — that path appears **once** in the tree.
- **Wrong:** `apps/web/apps/web` — that nested path **does not exist**; if you see it in a shell prompt, `cd` up until `pwd` ends with **`.../real-estate-platform/apps/web`** (exactly one `apps/web` at the end).

All **`vercel`** commands below assume:

```bash
cd /path/to/real-estate-platform/apps/web
```

Use your real home path instead of `/path/to` (e.g. `~/real-estate-platform/apps/web`).

## Non-interactive link (optional)

If `vercel link` prompts for the wrong scope/project:

```bash
vercel link --yes --scope drmmashhour-uxs-projects --project real-estate-platform
```

Adjust **`--scope`** / **`--project`** to match your Vercel team and project name.

## Environment variables

```bash
vercel env ls
vercel env pull .env.local
```

- **`POSTGRES_PRISMA_URL` / `POSTGRES_URL`:** If you use **Vercel Postgres**, the app maps these to **`DATABASE_URL`** when needed (`apps/web/lib/db/resolve-database-url.ts`).
- Remove or fix any template **`...@HOST/...`** value; if Vercel Postgres vars exist, the resolver overrides a **`HOST`** template at runtime.

## Monorepo install and build (match Vercel)

`apps/web/vercel.json` runs install/build from the **repository root**:

- `installCommand`: `cd ../.. && pnpm install --frozen-lockfile`
- `buildCommand`: `cd ../.. && pnpm build:web`

Locally, prefer:

```bash
cd /path/to/real-estate-platform
pnpm install --frozen-lockfile
pnpm build:web
```

## Prisma migrations

From **`apps/web`** (schema path is relative to this folder):

```bash
cd /path/to/real-estate-platform/apps/web
pnpm run prisma:migrate:deploy
```

Use a **direct** (non-pooler) URL for DDL if your provider recommends it — see **`DATABASE_URL_VERCEL_NEON.md`**.

## Deploy

```bash
cd /path/to/real-estate-platform/apps/web
vercel --prod
```

Or push to **`main`** if **Git** integration deploys the project.

## Verify

```bash
curl -sS "https://<your-host>/api/ready"
```

Expect **`"ready": true`**, **`"db": "ok"`**, **`"databaseUrlLooksLikeTemplate": false`**.

## Convenience scripts (from `apps/web`)

- `pnpm run vercel:env:ls`
- `pnpm run vercel:env:pull`

## Related

- **`VERCEL_PRODUCTION_CHECKLIST.md`** — full env table and security.
- **`DATABASE_URL_VERCEL_NEON.md`** — Neon + Vercel Postgres + `DATABASE_URL`.
