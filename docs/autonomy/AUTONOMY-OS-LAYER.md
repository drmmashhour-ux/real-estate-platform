# LECIPM autonomy OS layer (final intelligence layer)

Governed **outcome-based self-improving engine** (deterministic rules + auditable counters — not claimed ML). Dynamic STR/listing pricing, policy gates, learning aggregates, portfolio advisory rankings, admin dashboard — all **feature-flagged** and **admin-only** on HTTP APIs.

## Feature flags

| Env | Purpose |
|-----|---------|
| `FEATURE_AUTONOMY_CORE_V1` | Master gate for the OS layer services |
| `FEATURE_DYNAMIC_PRICING_V1` | Existing flag — required **with** core for `/api/autonomy/pricing` |
| `FEATURE_LEARNING_LOOP_V1` | `/api/autonomy/learning` |
| `FEATURE_AUTONOMY_ACTIONS_V1` | `/api/autonomy/action` |
| `FEATURE_PORTFOLIO_ALLOCATOR_V1` | Portfolio allocator usage (future routes; logic ready) |
| `FEATURE_AUTONOMY_DASHBOARD_V1` | `/api/autonomy/dashboard` + UI |

## APIs (admin session required)

- `POST /api/autonomy/pricing` — body `{ input: DynamicPricingInput, mode? }`
- `GET /api/autonomy/learning` — in-memory outcomes + snapshot
- `GET /api/autonomy/dashboard` — health, learning, impact, persisted pricing rows
- `POST /api/autonomy/action` — `createProposedAction` payload

## UI

- `/dashboard/admin/autonomy` — control center + dynamic pricing demo panel  
  (Locale-specific admin hub remains at `/[locale]/[country]/dashboard/admin/autonomy`.)

## Persistence (Prisma)

Models: `ManagerAiAutonomyAction`, `ManagerAiAutonomyOutcome`, `ManagerAiAutonomyPolicyEvent`, `ManagerAiAutonomyLearningSnapshot`, `ManagerAiAutonomyPricingDecision`, `ManagerAiAutonomyGovernanceState`.

Migration: `apps/web/prisma/migrations/20260402190000_manager_ai_autonomy_os_layer/migration.sql`

Repository: `apps/web/modules/autonomy/api/autonomy-os-persist.service.ts`

## Validation

```bash
cd apps/web && pnpm exec prisma validate --schema=./prisma/schema.prisma
pnpm exec prisma generate --schema=./prisma/schema.prisma
pnpm exec prisma migrate deploy   # when applying DB
pnpm exec vitest run modules/autonomy/testing/autonomy.spec.ts
pnpm exec tsc --noEmit -p tsconfig.json   # repo gate
```

Enable flags in `.env.local`, sign in as **ADMIN**, open `/dashboard/admin/autonomy`, run **Run pricing decision**, optionally `POST /api/autonomy/action` with a draft payload.

## Risks / follow-ups

- In-memory outcome store resets on deploy — wire `recordOutcomeEvent` + Prisma outcomes for durability.
- Governance singleton row not yet synced from `autonomy-governance.service.ts` memory state.
- Stretch widgets (approval inbox, charts) not implemented — core layer first.
