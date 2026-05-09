# LECIPM Forensic Architecture Audit

**Branch:** recovery from `main`
**Date:** 2026-05-09
**Method:** Static analysis of repository contents. All numbers verified by filesystem traversal.

---

## 1. Repository Structure

| Directory | Purpose | Notes |
|-----------|---------|-------|
| `apps/web` | Primary Next.js 16 application | 669 pages, 1520 API routes, 24 layouts |
| `apps/syria` | Separate Syria market app | Not imported by `apps/web`. Own codebase under `src/`. |
| `apps/carrefour-prestige` | Prestige real estate app | Own Next.js config, own Prisma schema. |
| `apps/admin`, `apps/bnhub`, `apps/broker` | Legacy/alternative apps | Not part of main `apps/web` build. |
| `apps/owner-dashboard`, `apps/broker-dashboard`, `apps/admin-dashboard` | Dashboard apps | Separate packages. |
| `apps/mobile`, `apps/mobile-app`, `apps/mobile-bnhub`, `apps/mobile-broker` | Mobile apps | Separate packages. |
| `packages/` | 20 shared packages | `ui`, `api-client`, `config`, `database`, `db`, `design-tokens`, `types`, `auth`, `utils`, etc. |
| `services/` | 19 service directories | 9 with own Prisma schemas (3–8 models each), 10 without. |
| `modules/` | 4 top-level modules | `analytics`, `bnhub`, `crm`, `realestate` (workspace packages). |
| `docs/` | Documentation | Architecture, engineering, API, deployment docs. |
| `infrastructure/` | Infra configs | `database/`, `deployment/`, `docker/`. |

### File Counts (apps/web)

| Metric | Count | Verification |
|--------|-------|--------------|
| Pages (`page.tsx`) | 669 | `find app/ -name "page.tsx"` |
| API routes (`route.ts`) | 1520 | `find app/ -name "route.ts"` |
| Layouts (`layout.tsx`) | 24 | `find app/ -name "layout.tsx"` |
| Prisma models | 746 | `grep -c "^model " prisma/schema.prisma` |
| Schema lines | 19,109 | `wc -l prisma/schema.prisma` |
| Top-level route groups | 103 | Directories under `app/` |

---

## 2. Dependency Graph

### apps/web depends on

| Dependency | Type | Source |
|------------|------|--------|
| `@prisma/client` ^6 | npm | `package.json` dependencies |
| `@lecipm/ui` workspace:* | workspace | `package.json` dependencies |
| `@lecipm/api-client` workspace:* | workspace | `package.json` dependencies |
| `next` 16.1.6 | npm | `package.json` dependencies |
| `react` 19.2.3 | npm | `package.json` dependencies |
| `stripe` ^14 | npm | `package.json` dependencies |
| `zod` ^4 | npm | `package.json` dependencies |

### apps/web does NOT depend on

- Any `services/*` package — no workspace reference, no import path.
- `apps/syria` — confirmed by grep; zero references from `apps/web` to `apps/syria`.
- `apps/carrefour-prestige` — separate app.
- Any top-level `modules/*` workspace packages — `apps/web` has its own `modules/` and `src/modules/` directories.

### services/*

19 total service directories. 9 have own Prisma schemas with separate models (3–8 each). 10 have no Prisma schema (AI services, analytics, backend, broker-crm, etc.). All are standalone — they do not import from `apps/web` and `apps/web` does not import from them.

### packages/db

`packages/db` exists as a workspace package. However, `apps/web` imports `@prisma/client` directly (not `@lecipm/db`). The `lib/db/prisma.ts` file in `apps/web` is the single approved Prisma entry point.

---

## 3. Prisma Consistency

| Item | Status | Detail |
|------|--------|--------|
| Main schema | Valid | 746 models, `prisma validate` passes |
| Client generation | Works | `prisma generate` succeeds with `prisma.config.ts` placeholder URL |
| Prisma version | 6.19.3 | Both CLI and client |
| `prisma.config.ts` | Present | Exists on this branch. Uses `defineConfig` from `prisma/config`. Loads `.env` and `.env.local`, falls back to placeholder URL for CLI operations. |
| Service schemas | 9 separate | `auth-service` (4), `booking-service` (5), `listing-service` (3), `messaging-service` (4), `payment-service` (8), `review-service` (4), `search-service` (3), `trust-safety` (3), `user-service` (4). Not shared with `apps/web`. |
| `prisma_split/` | Does not exist | Not present on this branch. |
| Postinstall | Safe | `DATABASE_URL=${DATABASE_URL:-postgresql://placeholder:...} prisma generate` — code-gen only, no DB connection. |

---

## 4. Route Fragmentation

Routes live directly under `app/` with no `[locale]` prefix on this branch. No `next-intl` dependency exists in `package.json`.

### Critical public routes

| Route | Hub | Auth | Status |
|-------|-----|------|--------|
| `/` | core | no | Public home |
| `/login` | core | no | Via `(auth)/login` group |
| `/register` | core | no | Via `(auth)/register` group |
| `/about-platform` | core | no | Platform info |
| `/search` | homes | no | Property search |
| `/properties` | homes | no | Listings |
| `/marketplace` | homes | no | Marketplace |
| `/mortgage` | homes | no | Mortgage tools |
| `/bnhub` | bnhub | no | Short-term stays |
| `/bnhub/stays` | bnhub | no | Stays search |
| `/contact` | immocontact | no | Communication hub |

### Dashboard routes

Under `app/(dashboard)/dashboard/` with sub-paths: `broker/`, `seller/`, `fsbo/`, `host/`, `hotel/`, `deals/`, `admin/`.

### Route count

669 pages + 1520 API routes = 2189 total route files. All confirmed present in the filesystem.

---

## 5. Module Ownership (Current vs Ideal)

### Two module trees

| Tree | Location | File count | Subdirectories |
|------|----------|------------|----------------|
| `apps/web/src/modules/` | New architecture | 970 files | 83 subdirectories |
| `apps/web/modules/` | Legacy | 768 files | 73 subdirectories |

Partial overlap exists — some module names appear in both (`analytics`, `crm`, `growth`, etc.). The two trees are not unified. Moving code between them was deemed too risky during recovery.

### Defined hub architecture (src/config/hubs.ts)

11 hubs defined in `PLATFORM_HUBS`:

| Hub ID | Name | Status | Primary Route |
|--------|------|--------|---------------|
| `core` | LECIPM Core | active | `/` |
| `homes` | LECIPM Homes | active | `/homes` |
| `bnhub` | BNHub | active | `/bnhub` |
| `invest` | LECIPM Invest | beta | `/invest` |
| `forms` | LECIPM Forms | beta | `/forms` |
| `immocontact` | ImmoContact | active | `/contact` |
| `dr-brain` | Dr Brain | internal | `/admin` |
| `compliance` | Compliance Engine | active | `/compliance` |
| `admin` | Admin | active | `/admin` |
| `growth` | Growth | active | `/growth` |
| `design-system` | Design System | active | `/dev/hub-atlas` |

Each hub has a README.md with boundary rules. Existing code has not been physically moved into the hub structure.

---

## 6. Build Bottlenecks

| Step | Result | Detail |
|------|--------|--------|
| webpack compilation | Succeeds | ~4 min with `--webpack` flag |
| TypeScript check | OOMs at 8GB | `tsc --noEmit` requires ~12–16GB heap |
| `vercel.json` NODE_OPTIONS | 8192 MB | Set to 8GB — insufficient for typecheck |
| Vercel Pro requirement | Yes | 16GB heap needed for full build + typecheck |
| Workaround | `NEXT_IGNORE_TYPESCRIPT_ERRORS=1` | Skips typecheck during `next build` |
| Static generation | None | All routes are dynamic (App Router). No `[locale]` prefix means no N×M page explosion. |
| Postinstall chain | Deterministic | `prisma generate` with placeholder URL, no network calls. |

---

## 7. Runtime Risks

### Database guard

`lib/db/prisma.ts` throws at import time if `DATABASE_URL` contains `"placeholder"` (unless `CI` or `VERCEL_ENV` is set). This prevents accidental connection attempts with the postinstall placeholder.

### Prisma singleton

Global singleton pattern (`globalForPrisma`) prevents multiple `PrismaClient` instances in development. No other files should construct `PrismaClient` directly.

### Stripe safety

`lib/stripe/envWarnings.ts` checks `STRIPE_SECRET_KEY` at startup. When unset, logs a warning and disables payment flows. No crash, no silent failure.

### Feature flags

`src/lib/env/features.ts` reads `process.env` with safe defaults. Public hubs default ON, beta/internal hubs default OFF. `FEATURE_COMPLIANCE` defaults ON (fail-closed).

### typeof window usage

63 files use `typeof window` checks. Most are in analytics/tracking code and client components. Some are in render-path components (maps, booking, auth), which creates hydration risk if the check affects rendered output rather than side effects.

---

## 8. Duplicate Logic Zones

| Area | Locations | Impact |
|------|-----------|--------|
| Module trees | `apps/web/modules/` (768 files, 73 dirs) vs `apps/web/src/modules/` (970 files, 83 dirs) | Unclear which module tree is canonical for any given feature |
| Design tokens | `components/ui/` (32 files), `src/design/` (9 files), `lib/ui/` (4 files), `packages/design-tokens/` (exists but minimal) | Token definitions may diverge |
| Auth routes | `app/(auth)/login/`, `app/(auth)/register/`, `app/auth/login/`, `components/auth/` (1 file) | Login flow entry points split across route groups |
| Seller flows | `app/sell/`, `app/seller/`, `app/(dashboard)/dashboard/seller/`, `app/(dashboard)/dashboard/fsbo/` | Four directories handle seller/FSBO flows |

---

## 9. Technical Debt Zones

### High priority

1. **Module tree unification** — Two parallel module directories with partial overlap. No automated enforcement of which tree owns which domain.
2. **RTL text-right usage** — 145 occurrences of physical `text-right` across 51 files. If Arabic locale is activated, these need replacement with `text-end` (logical property).
3. **typeof window in render path** — 63 files. Most are safe (analytics, side effects), but map components and some UI components use it in ways that may cause hydration mismatches.

### Medium priority

4. **Middleware size** — `middleware.ts` is 311 lines. Handles attribution, auth, demo mode, card blocking, and request logging. Not excessively large but growing.
5. **Feature flags scattered** — Two flag systems: `src/lib/env/features.ts` (hub-level, 11 flags) and `config/feature-flags.ts` (legacy, 2 flags + launch flags). Not yet unified.
6. **No automated circular dependency detection** — No build-time or CI check for circular imports.

### Low priority

7. **PWA disabled** — `next-pwa` is configured but `disable: true` is set. Service worker not active.
8. **Cache-Control forced to no-store** — `forceNoStoreDocumentCache` in `next.config.ts` disables CDN caching for all paths including `_next/static`. Marked as temporary.

---

## 10. Security Posture

| Control | Status | Detail |
|---------|--------|--------|
| Permissions-Policy | Blocks camera, microphone, geolocation | `camera=(), microphone=(), geolocation=()` in `next.config.ts`. Microphone blocking prevents voice features — not fixed on this branch. |
| X-Frame-Options | SAMEORIGIN | Prevents clickjacking. |
| X-Content-Type-Options | nosniff | Prevents MIME sniffing. |
| Referrer-Policy | strict-origin-when-cross-origin | Standard policy. |
| HSTS | Production only | `max-age=31536000; includeSubDomains` when `NODE_ENV=production` or `VERCEL=1`. |
| CORS | Not configured | No custom CORS headers in `next.config.ts` or middleware. Next.js default behavior (same-origin). |
| CSP | Not configured | No Content-Security-Policy header defined. `X-Frame-Options: SAMEORIGIN` provides basic frame protection. |
| Secrets in client bundle | None | Prisma is server-only. `STRIPE_SECRET_KEY` is server-only. Feature flags read `process.env` on server. |
| DATABASE_URL guard | Active | Runtime throw if placeholder URL reaches PrismaClient. |
| Raw card data blocking | Active | Middleware includes `hasRawCardLikePayload` check that blocks raw card numbers in request bodies. |
| Demo mode isolation | Active | `isDemoMode()` check with `isDemoModeApiMutationAllowed()` allowlist prevents unauthorized mutations in demo. |
