# Platform Core V2 — orchestration (priority, dependencies, scheduler, simulation)

## Purpose

Additive **decision intelligence** on top of Platform Core V1: heuristic **priority** snapshots, **dependency** edges, **scheduled** re-evaluation rows, and **heuristic simulation** previews for the internal dashboard. Live approval/execution semantics are unchanged; orchestration is **observability + ordering hints**.

## Feature flags

| Env | Meaning |
|-----|---------|
| `FEATURE_PLATFORM_CORE_V1` | Master gate for platform core. |
| `FEATURE_PLATFORM_CORE_PRIORITY_V1` | Persist `PlatformCoreDecisionPriority` rows + audit. |
| `FEATURE_PLATFORM_CORE_DEPENDENCIES_V1` | Persist/query `PlatformCoreDecisionDependency`; heuristic edges in dashboard. |
| `FEATURE_PLATFORM_CORE_SCHEDULER_V1` | `PlatformCoreDecisionSchedule` + due-run processing. |
| `FEATURE_PLATFORM_CORE_SIMULATION_V1` | Heuristic `simulateDecisionImpact` block in dashboard (first 24 decisions). |

Brain feedback from operator lifecycle events also requires `FEATURE_ONE_BRAIN_V2_OUTCOME_INGESTION_V1` (see `emitPlatformCoreBrainFeedback`).

## Persistence models

- `PlatformCoreDecisionPriority` — append-only style snapshots per scoring run (indexed by `decisionId`, `createdAt`).
- `PlatformCoreDecisionDependency` — edges (`REQUIRES`, `RELATED`, etc.; `BLOCKS` reserved for future use).
- `PlatformCoreDecisionSchedule` — at most one active schedule per decision in practice (`deleteMany` then `create` when rescheduling).

Migration: `apps/web/prisma/migrations/20260430284000_platform_core_v2_orchestration/migration.sql` (verify name in your tree).

## Execution flow

1. **Register decision** → optional `computeDecisionPriority` (best-effort; failures logged, registration still succeeds).
2. **Status updates** → `metadata.lifecycleHistory` appended with structured entries (malformed history entries are filtered when appending).
3. **Dismiss / execute / fail** → optional `emitPlatformCoreBrainFeedback` (swallows persistence errors; logs `[platform-core:brain-feedback]`).
4. **Scheduler** → `scheduleDecisionReevaluation` replaces prior row for same decision; `runScheduledEvaluations` processes due rows per-item (one failure does not stop the batch).

## Dashboard (`loadPlatformCoreDashboardPayload`)

- Loads orchestration via `loadOrchestrationForDecisions`. On **any** unexpected error, returns an **empty** orchestration object and logs `[platform-core:dashboard] loadOrchestrationForDecisions_failed` — the rest of the dashboard payload still loads.
- Simulations: per-decision try/catch; bad rows become `null` with a warn log.

## Health (`getPlatformCoreHealth`)

- **BLOCKS** dependency count and **overdue schedule** count are queried **only** when the corresponding feature flags are on — avoids misleading warnings when orchestration is not rolled out.
- Other thresholds (pending, tasks, conflict audits) remain as before.

## Rollout notes

- Flags can be enabled independently (e.g. priority without scheduler).
- Partial rollout: dashboard and health tolerate missing tables/queries when flags gate Prisma access.

## Migration step

After pulling schema changes:

```bash
cd apps/web && npx prisma migrate deploy
```

Dev:

```bash
cd apps/web && npx prisma migrate dev
```

## Validation commands

```bash
cd apps/web && npx prisma validate && npx prisma generate
cd apps/web && npx vitest run modules/platform-core/platform-core-v2.test.ts modules/platform-core/platform-core-brain-feedback.test.ts
```

## Typecheck (heap)

Full-app `tsc` may OOM in some environments. If needed:

```bash
cd apps/web && NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit
```

Do not treat full-project typecheck as mandatory in constrained CI if it cannot complete.
