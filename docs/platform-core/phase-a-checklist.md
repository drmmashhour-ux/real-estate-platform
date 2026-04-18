# Platform Core — Phase A readiness checklist (documentation only)

This checklist supports **governance and rollout review**. It does not enable features or change runtime behavior.

## Scope (Phase A focus: observation + priority safety)

Phase A here means: Platform Core is usable for **decision registration + audit**, with **priority snapshots** available when explicitly enabled — without depending on scheduler, dependency graph, or simulation for core safety.

## Flags (apps/web / deployment env)

| Concern | Env key | Notes |
|--------|---------|--------|
| Core API / decisions | `FEATURE_PLATFORM_CORE_V1` | Master switch for core services. |
| Priority persistence + scoring hook | `FEATURE_PLATFORM_CORE_PRIORITY_V1` | When off, `computeDecisionPriority` is **not** invoked from `registerDecision`; no priority rows written. |
| Scheduler UI / rows | `FEATURE_PLATFORM_CORE_SCHEDULER_V1` | Separate from priority. |
| Dependency detection | `FEATURE_PLATFORM_CORE_DEPENDENCIES_V1` | Separate from priority. |
| Heuristic simulation panel | `FEATURE_PLATFORM_CORE_SIMULATION_V1` | Separate from priority. |

## Expected behavior when Phase A flags are set

**With `FEATURE_PLATFORM_CORE_V1=1` and `FEATURE_PLATFORM_CORE_PRIORITY_V1=1`:**

- New decisions registered via `registerDecision` may trigger `computeDecisionPriority` **after** create (best-effort; errors swallowed so registration still succeeds).
- Rows may appear in `platform_core_decision_priority` (see Prisma model name in schema).

**With priority flag `0` / unset:**

- `registerDecision` does **not** call `computeDecisionPriority` (see `platform-core.service.ts`).
- Dashboard orchestration loads **no** priority rows from DB for the priority query path (`platform-history.service.ts` uses an empty list when the flag is off).

## Expected DB changes

- Priority **writes** only when **both** `platformCoreV1` and `platformCorePriorityV1` are true (see `computeDecisionPriority`).

## Expected UI changes

- Growth dashboard Platform Core section shows priority chips **only when** stored priority exists for a decision id (`PlatformCoreSectionClient.tsx` uses optional chaining on `orchestration.priorityByDecisionId[d.id]`).

## What should NOT happen in Phase A

- Scheduler, dependency, or simulation features **must not** activate solely because priority is on — each has its own flag in `loadOrchestrationForDecisions`.
- Priority failures **must not** block decision registration (wrapped in try/catch in `registerDecision`).

## Rollback

1. Set `FEATURE_PLATFORM_CORE_PRIORITY_V1=0` (or unset). New registrations stop writing priority snapshots.
2. Leave `FEATURE_PLATFORM_CORE_V1` per product needs; disabling core entirely stops new core decisions (stricter rollback).

## Verification commands (optional, local)

- `rg FEATURE_PLATFORM_CORE_PRIORITY apps/web/config/feature-flags.ts`
- `rg computeDecisionPriority apps/web/modules/platform-core`

---

*Last updated as part of V8 governance review; adjust when product Phase A definition changes.*
