# Domain architecture (monorepo)

This document describes the **domain-based layout** for the LECIPM platform. The primary Next.js application lives under [`apps/web`](../apps/web).

## Top-level layout (`apps/web`)

| Path | Responsibility |
|------|------------------|
| `app/` | Next.js App Router: pages and `app/api/*` route handlers (thin HTTP layer). |
| `components/` | UI: `common/`, `ui/`, `layout/`, and domain folders (`offers/`, `crm/`, `notifications/`, …). |
| `modules/` | Domain business logic: `services/`, `types.ts`, `constants.ts`, `validators.ts`, `__tests__/`. |
| `lib/` | Cross-cutting infrastructure: Prisma client, auth session helpers, email, Stripe, generic utilities. |
| `types/` | Shared TypeScript types (`global.ts`, `api.ts`, `common.ts`). |
| `hooks/` | Client-side React hooks. |
| `config/` | Branding, feature flags, hub config. |
| `scripts/` | Operational scripts. |
| `prisma/` | Schema and migrations. |

For detailed notes on routes, tenancy, and APIs, see [`apps/web/docs/ARCHITECTURE.md`](../apps/web/docs/ARCHITECTURE.md).

## Import conventions

- **Domain logic**: `import { … } from "@/modules/<domain>/services/..."`  
- **UI**: `import { … } from "@/components/..."`  
- **Shared hooks**: `import { … } from "@/hooks/..."`  
- **Infra / DB**: `import { prisma } from "@/lib/db"`  

`tsconfig.json` in `apps/web` defines explicit path aliases for `@/modules/*`, `@/components/*`, `@/hooks/*`, `@/types/*`, and `@/config/*` in addition to `@/*`.

## Domain modules

| Module | Path | Scope |
|--------|------|--------|
| `auth` | `modules/auth` | Placeholder for auth-domain types; session helpers remain in `lib/auth`. |
| `users` | `modules/users` | User-domain placeholders / future expansion. |
| `listings` | `modules/listings` | Listing-related domain surface. |
| `offers` | `modules/offers` | Offers, status machine, serialization, access. |
| `contracts` | `modules/contracts` | Lease/broker contracts, e-sign, templates. |
| `messaging` | `modules/messaging` | Conversations, permissions, messages. |
| `scheduling` | `modules/scheduling` | Appointments, availability, rules. |
| `documents` | `modules/documents` | Document center, permissions, storage. |
| `intake` | `modules/intake` | KYC / intake workflows. |
| `crm` | `modules/crm` | Broker CRM (formerly `lib/broker-crm`). |
| `notifications` | `modules/notifications` | In-app notification center + action queue. |
| `analytics` | `modules/analytics` | Product analytics helpers. |
| `portfolio` | `modules/portfolio` | Portfolio domain placeholder (investment portfolio may still use `lib/invest`). |
| `mortgage` | `modules/mortgage` | Mortgage expert flows, leads, billing. |
| `ai-deal-analyzer` | `modules/ai-deal-analyzer` | Deal scoring and analysis. |

## Service pattern

- **API routes** (`app/api/...`) should validate input, call a function in `modules/<domain>/services/`, and return JSON.
- **No duplicated business rules** in route files; keep them in services.
- **Prisma** is accessed from services or `lib/db`, not scattered ad hoc in UI.

## Legacy email helper

`lib/notifications.ts` (file) is the **email/dashboard notification** helper (`sendDashboardNotification`, etc.). It is **not** the same as `modules/notifications` (in-app notification center).
