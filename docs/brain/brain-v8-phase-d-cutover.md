# Brain V8 Phase D — primary presentation path (safe fallback)

## Purpose

Optional **V8-first** interpretation of the **Brain snapshot for display** (ordering/tags/notes), behind `FEATURE_BRAIN_V8_PRIMARY_V1`. **Stored** outcomes, weights, learning runs, and ingestion writers are **unchanged** in this phase.

## Flags

| Env | Code | Default | Role |
|-----|------|---------|------|
| `FEATURE_BRAIN_V8_PRIMARY_V1` | `oneBrainV8Flags.brainV8PrimaryV1` | off | Enables primary routing in `buildBrainOutputWithV8Routing`. |
| Phase C | `brainV8InfluenceV1` | off | When primary is **off**, unchanged Phase C behavior via `applyBrainV8PresentationOverlay`. |
| Shadow / persistence | existing Brain V8 flags | off | Unchanged. |

**Rollback:** unset or `0` `FEATURE_BRAIN_V8_PRIMARY_V1` — immediate return to Phase C overlay only.

## Routing

- **Primary off:** `buildBrainOutputWithV8Routing` → `applyBrainV8PresentationOverlay` (exact Phase C).
- **Primary on:** build shadow from snapshot → comparison quality → readiness validation → `applyBrainV8Influence(..., { primaryPath: true })` so V8 influence can apply even if Phase C influence flag is off. On any failure → fallback to `applyBrainV8PresentationOverlay`.

Entrypoints using routing: `getBrainSnapshotAction`, `loadPlatformCoreDashboardPayload` (brain payload).

## Validation gates

- Snapshot outcomes array valid.
- Non-empty outcomes require non-empty shadow sample; aggregate deltas finite.
- **Weak comparison** (Phase B quality) → fallback (do not treat as primary-safe).
- Post-apply: same outcome count and same `decisionId` multiset; finite `outcomeScore` on all rows.

## Fallback conditions

Throws, readiness failure, output validation failure → **current Brain presentation path** = Phase C overlay (`applyBrainV8PresentationOverlay`). Logged as `brain_v8_primary_fallback_current`.

## Observability

- `[brain:v8:adapter]` paths: `current_brain_phase_c`, `brain_v8_primary`, `brain_v8_primary_fallback_current`.
- `[brain:v8:primary]` events and frequent-fallback warning.
- Process-local: `getBrainV8PrimaryMonitoringSnapshot()` — success/fallback counts, reasons, last path (also shown compactly on Platform Core brain panel).

## What is NOT changed

- Learning, adaptation, outcome ingestion, and DB truth for weights/outcomes.
- Shadow observation and Phase B/C modules remain in place; primary routing composes them.

## Validation commands

```bash
cd apps/web
npx vitest run modules/platform-core/brain-v8-primary-routing.test.ts modules/platform-core/brain-v8-influence.test.ts
```

## Successful cutover (operational)

- Acceptable primary success rate and fallback rate for your environment.
- No unexpected empty snapshots when data exists.
