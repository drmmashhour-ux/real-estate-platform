# Monorepo layout (BNHub + LECIPM)

This repository uses **pnpm** workspaces. Install once at the root:

```bash
pnpm install
```

## Directory map

| Path | Role |
|------|------|
| `apps/web` | Primary Next.js app — BNHub + LECIPM UI, Prisma schema, `/api/*` |
| `apps/admin` | Admin dashboard (Next.js) |
| `apps/mobile` | Expo / React Native client (`@lecipm/mobile`) |
| `apps/web-next14-starter` | Legacy minimal Next 14 sample (optional; not production) |
| `packages/config` | Shared TS configs, ESLint ignore list, PostCSS/Tailwind preset |
| `packages/ui` | Shared UI primitives (grow by moving reusable components here) |
| `packages/utils` | Shared utilities (`@lecipm/utils`) |
| `packages/types` | Shared types (`@lecipm/types`) — import via `@shared-types/*` from `apps/web` |
| `packages/api-client` | Supabase / HTTP helpers (`@lecipm/api-client`, path `@api/*` in web) |
| `services/*` | Focused backends (auth, AI, listings, …) |
| `services/backend` | Reserved for a future BFF / API gateway (see README there) |
| `services/ai` | AI pipeline workers and related HTTP surface |
| `modules/*` | Domain modules consumed by apps |

## Common commands

```bash
pnpm dev              # main web app
pnpm dev:admin        # admin dashboard
pnpm dev:mobile       # Expo
pnpm build:web        # production build for apps/web
pnpm build            # all workspaces that define `build`
pnpm lint             # root ESLint (apps/web has its own Next ESLint config)
pnpm test             # all workspaces that define `test`
```

## Path aliases (`apps/web`)

Defined in `apps/web/tsconfig.json`:

- `@/*` — app root
- `@ui/*` → `packages/ui/src/*`
- `@utils/*` → `packages/utils/src/*`
- `@api/*` → `packages/api-client/src/*`
- `@shared-types/*` → `packages/types/src/*` (we avoid `@types/*` so it does not clash with DefinitelyTyped)

`next.config.ts` sets `transpilePackages` for `@lecipm/ui` and `@lecipm/api-client`.

## Adding a new app

1. Create `apps/<name>/` with its own `package.json` (`"private": true`, scoped name like `@lecipm/<name>`).
2. Ensure `pnpm-workspace.yaml` already includes `apps/*` (no change needed).
3. Extend `packages/config/tsconfig.nextapp.json` (or `tsconfig.base.json`) from the app `tsconfig.json`.
4. Add root scripts if needed: `pnpm --filter @lecipm/<name> dev`.

## Sharing code

- **UI:** move generic components into `packages/ui` and export from `src/index.ts` (or split files and use `exports` in `package.json`).
- **API clients:** add factories and typed wrappers in `packages/api-client`; keep secrets out of the package — pass URL/keys from app env.
- **Config:** add shared JSON/TS exports under `packages/config` (keep the existing Node config module in `packages/config/src` for non-Next consumers).

## Environment variables

- Root `.env.example` — pointers only.
- **Authoritative templates:** `apps/web/.env.example`, `apps/mobile/.env.example`, plus per-service examples.
- Never commit `.env`, `.env.local`, or production secrets (see `docs/git-rules.md` and Husky hooks).

## AI and scale-out

- **In-app:** Next routes under `apps/web/app/api` orchestrate BNHub + LECIPM.
- **Workers:** `services/ai`, `services/ai-manager`, `services/ai-operator` run specialized jobs or HTTP APIs.
- **Future:** `services/backend` can host a dedicated gateway without moving the whole monorepo.

## npm vs pnpm

The repo is standardized on **pnpm** (`packageManager` in root `package.json`). Commit **`pnpm-lock.yaml`** for reproducible CI and local installs.

## CI/CD

See **[docs/cicd.md](./cicd.md)** for GitHub Actions, Vercel (web + admin), env vars, and preview vs production behavior.
