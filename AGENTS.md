# AGENTS.md

## Cursor Cloud specific instructions

### Overview

LECIPM is a pnpm monorepo (Node 20, pnpm ≥9) for a real-estate ecosystem. The primary application is `apps/web` (Next.js 16, port 3001). See `README.md` for the full layout and command reference.

### Prerequisites

- **Node 20** — `.nvmrc` specifies 20. Use `nvm use 20` if the default differs.
- **pnpm 9.15.4** — declared in `packageManager` field. Install with `npm install -g pnpm@9.15.4` after switching to Node 20.
- **Docker** — needed for PostgreSQL. Start with `docker compose -f infrastructure/docker/docker-compose.yml up -d postgres`.

### Database

PostgreSQL 16 via Docker. Connection string for local dev: `postgresql://lecipm:lecipm@localhost:5432/lecipm`.

Create `apps/web/.env` with at minimum:
```
DATABASE_URL="postgresql://lecipm:lecipm@localhost:5432/lecipm"
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

Push schema: `pnpm --filter @lecipm/web exec prisma db push`

Seed: `pnpm db:seed` — the seed may fail near the end at the BNHub growth demo step (`assertAutonomyAllowedForHost` error). This is a known issue; core data (users, bookings, reviews, etc.) is seeded before it fails.

### Key commands

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Dev server (web) | `pnpm dev` (port 3001) |
| Lint (root) | `pnpm lint` |
| Lint (web only) | `pnpm --filter @lecipm/web lint` |
| Tests (web) | `pnpm --filter @lecipm/web test` (vitest) |
| DB push | `pnpm --filter @lecipm/web exec prisma db push` |
| DB seed | `pnpm db:seed` |

### Gotchas

- The root `pnpm db:push` script uses `npx tsx scripts/prisma-destructive-guard.ts` which may fail because `tsx` is not in the root PATH. Use `pnpm --filter @lecipm/web exec prisma db push` directly instead.
- Root-level `pnpm lint` lints the entire monorepo including generated Prisma code in services, which produces many pre-existing errors. Use `pnpm --filter @lecipm/web lint` for the main web app lint.
- Commit messages must follow conventional commits format (`feat|fix|refactor|docs|chore|test|ci|build: description`), enforced by `.husky/commit-msg`.
- The pre-commit hook runs `lint-staged` which invokes `scripts/git/guard-staged.mjs`.
- Supabase and Stripe keys are optional for basic local dev; the app boots and serves pages without them, but auth and payment flows require them.
- The Docker daemon in cloud VMs needs `fuse-overlayfs` storage driver and `iptables-legacy`. See the Docker setup in the environment config.
