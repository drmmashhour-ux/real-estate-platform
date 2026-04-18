# LECIPM Architecture v1 — Production Structured System

This document defines **conventions and a migration path**. It does not require a single big-bang refactor. Existing routes and modules keep working; new work follows these rules.

## Principles

1. **Business logic** lives in `apps/web/modules/<domain>/` services (and shared packages where appropriate).
2. **API route handlers** stay thin: parse input → call service → return JSON.
3. **Feature flags** come only from `apps/web/config/feature-flags.ts` (env-backed).
4. **Sensitive operations** are server-only; audit via `modules/growth-engine-audit` or `modules/analytics/audit-log.service.ts`.
5. **Backward compatibility** is default: re-exports and facades over old paths are preferred to deletes.

## Target module map (`apps/web/modules/`)

Domains align with product areas. Not every folder exists yet; **add incrementally** when touching that area.

| Domain | Examples (existing or planned) |
|--------|--------------------------------|
| `brokerage/` | Office, commissions, residential access |
| `bnhub/` | Listings, bookings, host flows (often under `lib/bnhub` today — migrate gradually) |
| `pricing/` | Pricing engine, calculators |
| `monetization/` | Plans, Stripe wrappers |
| `growth/` | Funnels, acquisition, referrals |
| `trust/` | Fraud, trust presentation |
| `compliance/` | QA, regulatory surfaces |
| `documents/` | Document pipeline, drafting |
| `deals/` | Deal workspace, execution |
| `crm/` | Broker CRM, pipelines |
| `messaging/` | Threads, notifications content |
| `notifications/` | User notifications (distinct from push delivery) |
| `mobile/` | Mobile broker / BNHub API helpers |
| `founder/` | Founder console, simulation (where applicable) |
| `investor/` | Investor metrics, narrative |
| `analytics/` | Audit log, event tracker (see `audit-log.service.ts`) |
| `admin/` | Admin-only orchestration |

### File shape per module

- `*.types.ts` — domain types
- `*.service.ts` — orchestration and DB use
- `*.engine.ts` — pure/heavy algorithms (optional)
- `*.validator.ts` — Zod or input guards (optional)
- `*.explainer.ts` — human-readable copy for UI or exports (optional)

## Cross-domain rules

- Prefer **calling a service** in another domain over duplicating queries.
- Avoid **cross-domain Prisma** in React components; components call hooks/APIs only.

## API path convention (target)

Pattern: `/api/{domain}/{resource}/...` — see [../api/NORMALIZATION-V1.md](../api/NORMALIZATION-V1.md).

Legacy paths remain valid until migrated behind flags or versioned routes.

## QA

- [../engineering/LECIPM-ARCHITECTURE-V1-QA.md](../engineering/LECIPM-ARCHITECTURE-V1-QA.md)

## Related docs

- [MODULES-REGISTRY.md](./MODULES-REGISTRY.md) — platform module catalog
- [LECIPM-API-ARCHITECTURE-BLUEPRINT.md](./LECIPM-API-ARCHITECTURE-BLUEPRINT.md) — historical API blueprint
- [../../apps/web/config/feature-flags.ts](../../apps/web/config/feature-flags.ts) — flags source of truth
