# Local DB fallback

Use this only for local development when cloud Postgres (Neon/Supabase) is blocked or unavailable. Requires [Docker](https://docs.docker.com/get-docker/) for `db:local:*` commands.

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
