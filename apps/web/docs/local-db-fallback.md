# Local DB fallback

Use this only for local development when cloud Postgres (Neon/Supabase) is blocked or unavailable. Requires [Docker](https://docs.docker.com/get-docker/) for `db:local:*` commands.

Local Postgres listens on **host port 5433** (see `docker-compose.local-db.yml`) so it does not clash with other engines on 5432.

## Dual DB mode (Neon vs local, no hand-editing `DATABASE_URL`)

In `apps/web/.env.local` set:

- `PRIMARY_DATABASE_URL` — Neon pooled URL
- `LOCAL_DATABASE_URL` — default `postgresql://postgres:postgres@localhost:5433/lecipm_dev?schema=public`
- `DB_MODE` — `auto` (probe Neon, else local), `neon` (always Neon), or `local` (always local)

Then run:

```bash
pnpm db:resolve
```

This **writes** `DATABASE_URL=` in `.env.local` for Prisma/Next. Vercel/production should set `DATABASE_URL` (or `DB_MODE=neon` + `PRIMARY_DATABASE_URL`) in the project env — **do not** rely on this script in production deploys; it is for local dev.

## Start local Postgres

pnpm db:local:up

## Switch .env.local to local DB

pnpm db:use-local

This creates a timestamped backup of the previous .env.local.

## Generate Prisma client

pnpm exec prisma generate --schema=./prisma/schema.prisma

## Apply migrations locally

pnpm db:local:migrate

## Verify

pnpm db:verify

## Start app

pnpm dev

## Stop local DB

pnpm db:local:down

## Full reset

pnpm db:local:reset

Warning:
Do not use the local DATABASE_URL in production.
