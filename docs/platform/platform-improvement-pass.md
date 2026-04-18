# Platform improvement pass (V1)

## Purpose

The **platform improvement pass** is an **advisory, structural** review that helps operators see:

- product clarity across major surfaces
- monetization bucket mapping and gaps
- trust pattern coverage
- operational scatter / consolidation opportunities
- data moat readiness (signals captured vs missing)
- a **deterministic top-5 priority list** ranked by business value themes

It does **not** change Stripe, booking, checkout, ranking, or core lead flows. It does **not** add new AI layers. It is **visibility and guidance only**.

## Review dimensions

| Module | File |
| --- | --- |
| Product clarity | `apps/web/modules/platform/platform-clarity-review.service.ts` |
| Monetization architecture | `apps/web/modules/platform/platform-monetization-review.service.ts` |
| Trust consolidation | `apps/web/modules/platform/platform-trust-review.service.ts` |
| Operational simplicity | `apps/web/modules/platform/platform-ops-review.service.ts` |
| Data moat readiness | `apps/web/modules/platform/platform-data-moat-review.service.ts` |
| Priority engine | `apps/web/modules/platform/platform-improvement-priority.service.ts` |
| Full bundle + monitoring | `apps/web/modules/platform/platform-improvement-review.service.ts` |

The bundle composes all reviews and records monitoring counters (`[platform:improvement]` logs).

## Priority logic

`buildPlatformImprovementPriorities()` merges:

- High-priority monetization gaps (revenue)
- Trust coverage gaps (trust / conversion)
- Ops duplicate panels and shortcuts (ops)
- Data moat missing signals (data)
- Clarity friction samples (conversion)

Items are deduplicated, sorted by urgency × category weight, and **capped at five**.

## Feature flag

| Env | Role |
| --- | --- |
| `FEATURE_PLATFORM_IMPROVEMENT_REVIEW_V1` | Master gate — admin page + API |

Default **off**. When off, `/admin/platform-improvement` returns **404** and `GET /api/platform/improvement-review` returns **404**.

## Safety guarantees

- No payment or checkout code changes in this pass.
- No removal of major systems.
- Reviews use **feature-flag snapshots** and static rules — safe with partial configuration data.
- Trust UI (`PlatformTrustStrip`) only renders lines supplied by callers; use `buildTrustStripLines()` with **real** booleans/dates.

## UI surfaces

- **Admin page**: `/admin/platform-improvement` (requires admin + flag).
- **API**: `GET /api/platform/improvement-review` (admin + flag).
- **Trust strip**: `apps/web/components/shared/PlatformTrustStrip.tsx` (reusable; data-driven).

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/platform/__tests__/platform-*.test.ts
```

## Confirmation

This pass is meant to guide the **strongest next improvements** in order: money, trust, clarity, operations, and defensibility — without mutating core business logic.
