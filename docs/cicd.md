# CI/CD — BNHub monorepo

**Production releases, staging, rollback, and checklists:** see **`docs/release-strategy.md`**.

## GitHub Actions

| Workflow | When | Purpose |
|----------|------|---------|
| **`CI`** (`.github/workflows/ci.yml`) | Push to `main`, PRs targeting `main` | Install, Prisma validate (`apps/web`), **lint** (strict), **`pnpm build:ci`** (web + admin + `modules/*` + `packages/*`), optional tests |
| **`Deploy (Vercel CLI)`** (`.github/workflows/deploy-vercel.yml`) | Push/PR to **`main`** and **`develop`** | Optional CLI deploy: previews on PRs; **`main`** → prod; **`develop`** → staging projects when **`ENABLE_VERCEL_STAGING`** is set |
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

### Staging vs production (recommended)

Use **separate Vercel projects** (or separate Git connections) so staging never shares production env vars:

| Project | Production branch | Env vars |
|---------|-------------------|----------|
| Web — **staging** | **`develop`** | Staging Supabase / DB / test Stripe |
| Web — **production** | **`main`** | Production secrets |
| Admin — **staging** | **`develop`** | Same split |
| Admin — **production** | **`main`** | Production secrets |

### Two production projects (minimal Git integration)

1. **Project: BNHub Web (prod)**  
   - Root Directory: **`apps/web`**  
   - Production Branch: **`main`**  
   - Preview: PRs optional.

2. **Project: BNHub Admin (prod)**  
   - Root Directory: **`apps/admin`**  
   - Production Branch: **`main`**.

Duplicate for **staging** with Production Branch **`develop`** (see **`docs/release-strategy.md`**).

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

With the integration, each PR gets **unique preview URLs** per project. Merging to **`main`** promotes to **production** after a successful Vercel build. With **staging projects** tied to **`develop`**, each merge to **`develop`** updates your stable **staging** URL (see **`docs/release-strategy.md`**).

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
| `VERCEL_PROJECT_ID_WEB` | Project ID for **web** (production project) |
| `VERCEL_PROJECT_ID_ADMIN` | Project ID for **admin** (production project) |
| `VERCEL_PROJECT_ID_WEB_STAGING` | (Optional) Web **staging** project — used when **`ENABLE_VERCEL_STAGING`** = `true` |
| `VERCEL_PROJECT_ID_ADMIN_STAGING` | (Optional) Admin **staging** project |

**Variables** (not secrets): set **`ENABLE_VERCEL_STAGING`** = `true` to deploy **`develop`** pushes to the staging project IDs above via CLI.

**Fork PRs:** deploy jobs are skipped for forks (no access to secrets).

**CI vs deploy:** CI and CLI deploy workflows run in parallel. To require green CI before deploy, rely on **Vercel’s Git integration** (it builds after push), or add branch protection requiring the **CI** check before merge, then deploy only from `main`.

---

## Safety checklist

- [ ] No `.env` or live keys in git (see `docs/git-rules.md`, Husky guards).
- [ ] Broader security: `docs/security-inventory.md`, `docs/security-checklist.md`, `docs/security-secrets.md`.
- [ ] Vercel: preview and production env vars reviewed separately.
- [ ] `main` protected: required status check **CI**.
