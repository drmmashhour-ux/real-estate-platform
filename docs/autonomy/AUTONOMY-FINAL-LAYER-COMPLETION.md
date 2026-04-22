# LECIPM autonomy final layer — completion notes

Governed **outcome-based self-improving engine** (not unrestricted ML): policy evaluation, explainable dynamic pricing, learning snapshots, portfolio capital recommendations, admin control center.

## Feature flags (env)

All default **off** unless set (see `apps/web/.env.example`):

| Env | Purpose |
|-----|---------|
| `FEATURE_AUTONOMY_CORE_V1` | Core autonomy OS gates |
| `FEATURE_DYNAMIC_PRICING_V1` | Dynamic pricing math + `/api/autonomy/pricing` |
| `FEATURE_LEARNING_LOOP_V1` | Outcomes + `/api/autonomy/learning`, `/api/autonomy/outcome` |
| `FEATURE_AUTONOMY_ACTIONS_V1` | Proposed actions + `/api/autonomy/action` |
| `FEATURE_PORTFOLIO_ALLOCATOR_V1` | Portfolio allocator module usage |
| `FEATURE_AUTONOMY_DASHBOARD_V1` | `GET /api/autonomy/dashboard` |

Dynamic pricing also requires **both** `FEATURE_AUTONOMY_CORE_V1` and `FEATURE_DYNAMIC_PRICING_V1` (`autonomy-layer-gate.ts`).

## Key files

| Area | Path |
|------|------|
| Types | `apps/web/modules/autonomy/types/autonomy.types.ts` |
| Policy | `apps/web/modules/autonomy/policy/autonomy-policy.service.ts` |
| Pricing | `apps/web/modules/autonomy/pricing/dynamic-pricing.service.ts` |
| Learning | `apps/web/modules/autonomy/learning/*` |
| Orchestrator | `apps/web/modules/autonomy/engine/autonomy-orchestrator.service.ts` |
| Governance | `apps/web/modules/autonomy/engine/autonomy-governance.service.ts` |
| Actions | `apps/web/modules/autonomy/actions/autonomy-actions.service.ts` |
| Persist | `apps/web/modules/autonomy/api/autonomy-os-persist.service.ts` |
| Dashboard UI | `apps/web/modules/autonomy/dashboard/autonomy-dashboard.tsx` |
| Admin page | `apps/web/app/dashboard/admin/autonomy/page.tsx` |
| APIs | `apps/web/app/api/autonomy/*/route.ts` |
| Prisma | `ManagerAiAutonomy*` models in `apps/web/prisma/schema.prisma` |
| Tests | `apps/web/modules/autonomy/testing/autonomy.spec.ts` |

## APIs

- `GET /api/autonomy/dashboard` — health, learning, impact, pricing rows (admin + flags)
- `POST /api/autonomy/pricing` — `buildDynamicPricingDecision`
- `GET /api/autonomy/learning` — learning snapshot + in-memory events
- `POST /api/autonomy/action` — create proposed action (persist optional)
- `POST /api/autonomy/outcome` — record outcome (learning flag)

## Local validation

1. **Typecheck**: `cd apps/web && npx tsc --noEmit` (or monorepo `pnpm` script if defined)
2. **Tests**: `cd apps/web && npx vitest run modules/autonomy/testing/autonomy.spec.ts`
3. **Prisma**: `cd apps/web && npx prisma validate`
4. **Runtime**: Enable flags in `.env.local`, sign in as admin, open `/dashboard/admin/autonomy`, confirm snapshot loads or shows flag/auth error.
5. **Pricing**: From control center, run “Run pricing decision” or `POST /api/autonomy/pricing` with JSON body `{ "mode": "SAFE_AUTOPILOT", "input": { "listingId": "…", "basePrice": 180, "minPrice": 120, "maxPrice": 260 } }`.
6. **Outcome**: `POST /api/autonomy/outcome` with required fields (`actionId`, `entityId`, `entityType`, `domain`, `metric`, `label`).

## Risks / follow-ups

- In-memory outcome store resets on deploy; optional sync from `ManagerAiAutonomyOutcome` for dashboard reads.
- `ManagerAiAutonomyLearningSnapshot` / `ManagerAiAutonomyGovernanceState` tables exist for future periodic persistence.
- Locale dashboard (`/[locale]/[country]/dashboard/admin/autonomy`) is BNHub-focused; JSON control center lives at `/dashboard/admin/autonomy`.
