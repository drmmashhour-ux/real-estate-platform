# Platform Core V2 — rollout & final acceptance

## What already exists (do not duplicate)

- **Types**: `CoreDecisionPriority`, `CoreDecisionDependency`, `CoreDecisionLifecycle`, `CoreDecisionSimulationResult` in `platform-core.types.ts`.
- **Prisma**: `PlatformCoreDecisionPriority`, `PlatformCoreDecisionDependency`, `PlatformCoreDecisionSchedule` (see migration under `apps/web/prisma/migrations/`).
- **Services**: `platform-core-priority.service.ts`, `platform-core-dependency.service.ts`, `platform-core-conflict.service.ts`, `platform-core-scheduler.service.ts`, `platform-core-simulation.service.ts`.
- **Repository**: lifecycle append in `updateDecisionStatus`, `appendLifecycleEvent`, `getDecisionLifecycle` in `platform-core.repository.ts`.
- **Dashboard**: `loadOrchestrationForDecisions` in `platform-history.service.ts` (priorities, schedules, dependencies, edges, conflicts, simulations); resilient empty orchestration on failure.
- **UI**: `PlatformCoreSectionClient.tsx` — priority, dependency counts, conflicts, lifecycle, re-eval, simulation (all labeled heuristic where applicable).
- **Health**: `platform-health.service.ts` — conflict/stale/blocked-deps/execution-ratio/overdue-schedule warnings; dependency/scheduler counts respect feature flags.
- **Brain feedback**: `emitPlatformCoreBrainFeedback` in `brain-outcome-ingestion.service.ts` — best-effort, non-blocking (try/catch + log on failure).
- **Detail doc**: `docs/platform-core/platform-core-v2-orchestration.md`.

## Session fixes (reference)

- Priority DB write failures contained (log + return computed priority).
- Failed execution Brain feedback wired with swallow-on-error.
- Simulation notes rendered; dashboard simulation rows try/catch per decision.
- Overdue schedule health warning; scheduler queries gated by scheduler flag.
- Orchestration load wrapped in try/catch; lifecycle metadata filtering hardened.
- Tests: `platform-core-v2.test.ts`, `platform-core-brain-feedback.test.ts` (as present in repo).

## Flags & suggested rollout order

1. `FEATURE_PLATFORM_CORE_V1` — master.
2. `FEATURE_PLATFORM_CORE_PRIORITY_V1` — optional first orchestration slice.
3. `FEATURE_PLATFORM_CORE_DEPENDENCIES_V1` — graph + detected edges.
4. `FEATURE_PLATFORM_CORE_SCHEDULER_V1` — schedules + health overdue signal.
5. `FEATURE_PLATFORM_CORE_SIMULATION_V1` — heuristic simulation block (first 24 decisions).
6. `FEATURE_ONE_BRAIN_V2_OUTCOME_INGESTION_V1` — required for persisting Brain feedback rows from dismiss/execute/fail (feedback still no-ops safely if off).

## Migration

Apply Prisma migrations so orchestration tables exist before enabling flags in production:

```bash
cd apps/web && npx prisma migrate deploy
```

## Dashboard & health

- **Dashboard**: Internal Platform Core section; orchestration may be empty if core off, flags off, or load error (logged, non-fatal).
- **Health**: Platform summary warnings; BLOCKS dependency and overdue schedule metrics only queried when the corresponding flags are on.

## Brain feedback

- Not a substitute for full outcome ingestion; lightweight priors only.
- Failures must not block dismiss/execute flows (handled in service + ingestion).

## Test status (targeted)

```bash
cd apps/web && pnpm exec vitest run modules/platform-core/platform-core-v2.test.ts modules/platform-core/platform-core-brain-feedback.test.ts
```

## Local validation commands

```bash
cd apps/web && npx prisma validate && npx prisma generate
cd apps/web && pnpm exec vitest run modules/platform-core/platform-core-v2.test.ts
```

Full workspace typecheck/build may require a larger heap:

```bash
cd apps/web && NODE_OPTIONS=--max-old-space-size=8192 pnpm run ci:typecheck
cd apps/web && NODE_OPTIONS=--max-old-space-size=8192 pnpm run build
```

Adjust script names to match `apps/web/package.json`. **Run these locally/CI** — do not assume they pass in constrained environments.

## Acceptance criteria (final)

- [ ] Migrations applied in target environment.
- [ ] Flags enabled in intended order; core off leaves UI/health safe.
- [ ] Vitest platform-core modules green.
- [ ] `prisma validate` green after schema pulls.
- [ ] Optional: `ci:typecheck` / `build` with increased `NODE_OPTIONS` if OOM.
