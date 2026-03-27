# Web application architecture

This document describes how the **Next.js app** under `apps/web` is organized. The monorepo may contain other services; this folder is the primary product surface (marketing + authenticated app + APIs).

## Layers

- **`app/`** — App Router: route groups separate marketing `(marketing)`, authenticated workspace shortcuts `(dashboard)`, auth aliases `(auth)`, internal tools `(internal)`, and `api/` route handlers.
- **`components/`** — UI: `common/` (shared primitives), `ui/`, `layout/`, and domain folders (`offers/`, `crm/`, `notifications/`, `messaging/`, …).
- **`modules/`** — **Domain business logic** under `modules/<domain>/services/`, plus per-module `types.ts`, `constants.ts`, `validators.ts`, and `__tests__/` for future tests. Route handlers and React components should call into modules instead of embedding rules.
- **`lib/`** — Cross-cutting infrastructure only: database client (`lib/db.ts` → `lib/db/prisma.ts`), auth session helpers, email, Stripe, caching, generic utilities. **Domain folders** (offers, contracts, messaging, …) live under **`modules/`**, not under `lib/`.
- **`config/`** — Branding, theme, typography, feature flags.
- **`types/`** — Shared TypeScript types for API and app-wide primitives (`global.ts`, `api.ts`, `common.ts`).
- **`hooks/`** — Client hooks (e.g. `use-tenant-context.ts`, `use-product-insights.ts`).
- **`prisma/`** — Schema, migrations, and `seeds/`.
- **`scripts/`** — Operational and codegen scripts (run with `npx tsx`).
- **`assets/`** — Private or generated marketing assets.
- **`public/`** — Static files; branding logos live under `public/branding/`.

## Path aliases (`tsconfig.json`)

- `@/*` → project root
- `@/modules/*` → `modules/*`
- `@/components/*` → `components/*`
- `@/hooks/*` → `hooks/*`
- `@/types/*` → `types/*`
- `@/config/*` → `config/*`

Prefer **`@/modules/<domain>/services/...`** for domain imports.

## Email vs in-app notifications

- **`lib/notifications.ts`** — Legacy email/dashboard helpers (`sendDashboardNotification`, etc.).
- **`modules/notifications/services/`** — In-app notification center, action queue, audit events.

## Multi-tenant SaaS

- **Tenancy** is modeled in `modules/tenancy` and enforced in API services (tenant id on requests, query scoping, audits in `lib/audit` as implemented).
- **Feature flags** in `config/feature-flags.ts` gate gradual rollout.

## URL map notes

Some paths in the target architecture overlap **existing** public routes in this codebase:

| Intended shortcut | Conflict | Current workspace URL |
|-------------------|----------|------------------------|
| `/listings` | Public listing catalog uses `/listings` | `/dashboard/listings` |
| `/messages` | Guest/host messaging uses `/messages` | `/dashboard/messages` |

Shortcuts were not added at those URLs to avoid breaking public pages. Prefer `/dashboard/...` for the CRM workspace until a migration re-homes the public routes.

## API surface

Handlers live under `app/api/*`. New **facade** stubs: `api/tenants`, `api/crm`, `api/finance` may return `501` until unified behind `modules/*`.

See also the repo-level [`docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md) for the domain module table and naming conventions.
