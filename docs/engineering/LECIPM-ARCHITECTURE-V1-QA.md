# LECIPM Architecture v1 — QA checklist

Use before/after incremental refactors (not only one release).

## Structure & imports

- [ ] New domain logic lives under `apps/web/modules/<domain>/` with `*.service.ts` where appropriate.
- [ ] API handlers import services, not inline multi-step DB logic (migrate opportunistically).
- [ ] `@/lib/api-response` or `@/lib/api/api-response` — consistent JSON helpers for new routes.

## Safety

- [ ] Risky behavior behind env-backed flags in `apps/web/config/feature-flags.ts`.
- [ ] Sensitive paths server-only; no secrets in client bundles.

## Observability

- [ ] Critical failures use `routeErrorResponse` or `logError` + safe client message.
- [ ] Audit-worthy actions use `modules/analytics/audit-log.service.ts` (or existing domain audit).

## Access

- [ ] Role checks use existing `require*` helpers or `lib/access-control` helpers for simple cases.

## Regression

- [ ] Smoke-test affected API routes and pages.
- [ ] Prisma: `pnpm exec prisma validate` (from app with schema).

## Known limits (v1)

- Full API path renames and Prisma-wide cleanup are **phased**; legacy routes remain valid until migrated.
