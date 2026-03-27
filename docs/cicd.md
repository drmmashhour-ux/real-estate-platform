# CI/CD — BNHub monorepo

## GitHub Actions

| Workflow | When | Purpose |
|----------|------|---------|
| **`CI`** (`.github/workflows/ci.yml`) | Push to `main`, PRs targeting `main` | Install, Prisma validate (`apps/web`), **lint** (strict), **`pnpm build:ci`** (web + admin + `modules/*` + `packages/*`), optional tests |
| **`Deploy (Vercel CLI)`** (`.github/workflows/deploy-vercel.yml`) | Same triggers | Optional CLI deploy for **`apps/web`** and **`apps/admin`** |
| **`Backend (optional)`** | Changes under `services/backend/` | Build/test when `services/backend/package.json` exists (`@lecipm/backend`) |

### CI behavior

- **Fails** if lint or build fails (no `continue-on-error`).
- **pnpm**: version **9**, Node **20** (LTS), `pnpm install --frozen-lockfile`.
- **Cache**: `actions/setup-node` with `cache: pnpm` (pnpm store).
- **Tests**: `pnpm test || echo "No tests yet..."` — step stays green; tighten to hard-fail when suites are stable.

### Local parity

```bash
pnpm install
pnpm lint
pnpm run build:ci     # same as GitHub Actions (deployable apps + shared modules/packages)
pnpm build            # full monorepo including all services (may fail until legacy services are fixed)
pnpm dev              # main web app
pnpm dev:platform     # web + admin in parallel
```

---

## Vercel (recommended: GitHub integration)

The most reliable setup for **preview + production** is the [Vercel for GitHub](https://vercel.com/docs/deployments/git/vercel-for-github) integration (no deploy secrets in Actions unless you use the CLI workflow below).

### Two projects, one repo

1. **Project: BNHub Web**  
   - Root Directory: **`apps/web`**  
   - Framework: Next.js (auto)  
   - Production Branch: **`main`**  
   - Enable **Preview Deployments** for pull requests.

2. **Project: BNHub Admin**  
   - Root Directory: **`apps/admin`**  
   - Same branch / preview settings.

### Environment variables (Vercel dashboard)

Set in **Production** and **Preview** as needed. **Do not commit secrets.**

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never `NEXT_PUBLIC_*` |
| `DATABASE_URL` | Postgres for Prisma (`apps/web`) |
| Other API keys | Stripe, maps, AI providers, etc. |

Copy from **`apps/web/.env.example`** / **`apps/admin`** templates; mirror names in Vercel.

### Preview URLs

With the integration, each PR gets **unique preview URLs** per project. Merging to **`main`** promotes to **production** after a successful Vercel build.

---

## Vercel CLI workflow (optional)

Workflow: `.github/workflows/deploy-vercel.yml`. It is **off by default** so missing secrets do not fail CI.

1. In GitHub → **Settings → Secrets and variables → Actions → Variables**, add **`ENABLE_VERCEL_CLI_DEPLOY`** = `true`.
2. Add the secrets below.

**Repository secrets:**

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | [Vercel token](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Team / user ID (Vercel project settings → General) |
| `VERCEL_PROJECT_ID_WEB` | Project ID for the **web** Vercel project |
| `VERCEL_PROJECT_ID_ADMIN` | Project ID for the **admin** Vercel project |

**Fork PRs:** deploy jobs are skipped for forks (no access to secrets).

**CI vs deploy:** CI and CLI deploy workflows run in parallel. To require green CI before deploy, rely on **Vercel’s Git integration** (it builds after push), or add branch protection requiring the **CI** check before merge, then deploy only from `main`.

---

## Safety checklist

- [ ] No `.env` or live keys in git (see `docs/git-rules.md`, Husky guards).
- [ ] Broader security: `docs/security-inventory.md`, `docs/security-checklist.md`, `docs/security-secrets.md`.
- [ ] Vercel: preview and production env vars reviewed separately.
- [ ] `main` protected: required status check **CI**.
