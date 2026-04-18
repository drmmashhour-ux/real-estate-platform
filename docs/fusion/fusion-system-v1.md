# Fusion System V1 (read-only orchestration)

## Purpose

An **additive** layer that **observes**, **normalizes**, **scores**, **compares**, and emits **advisory** outputs across:

- **Brain** (V8 shadow monitoring, snapshot outcomes/weights)
- **Ads** (autopilot V8 process-local monitoring)
- **Operator** (recent assistant recommendations, read-only list)
- **Platform Core** (recent decisions when enabled)

Fusion **does not** replace these systems, **does not** auto-execute actions, and **does not** mutate their stored truth.

## Flags (`fusionSystemFlags`)

| Env | Code | Default | Role |
|-----|------|---------|------|
| `FEATURE_FUSION_SYSTEM_V1` | `fusionSystemV1` | off | Master enable for fusion module surfaces. |
| `FEATURE_FUSION_SYSTEM_SHADOW_V1` | `fusionSystemShadowV1` | off | Required with master for **read-only** fusion compute (`isFusionOrchestrationActive()`). |
| `FEATURE_FUSION_SYSTEM_PERSISTENCE_V1` | `fusionSystemPersistenceV1` | off | Optional append-only `FusionSystemSnapshot` rows. |
| `FEATURE_FUSION_SYSTEM_INFLUENCE_V1` | `fusionSystemInfluenceV1` | off | Phase B presentation-only influence overlay (bounded; does not execute). |
| `FEATURE_FUSION_SYSTEM_PRIMARY_V1` | `fusionSystemPrimaryV1` | off | Phase C — Fusion as **primary advisory composition surface** (grouped/ranked presentation); see [fusion-system-phase-c-primary-surface.md](./fusion-system-phase-c-primary-surface.md). |

**Rollback:** set master and/or shadow to `0` / unset — fusion snapshot builder returns `null` immediately when orchestration is inactive. Disable Phase C by setting `FEATURE_FUSION_SYSTEM_PRIMARY_V1=0` (Phase B behavior preserved).

## Normalization model

Subsystem outputs are mapped to `FusionNormalizedSignal` with provenance, bounded scores (0–1 where applicable), and metadata references — **inputs are never mutated**.

## Scoring model

`FusionScore` aggregates subsystem signals with **explicit equal default weights** (0.25 each) over **present** sources — missing subsystems reduce contribution without crashing. Conflict penalties adjust readiness.

## Conflict model

`FusionConflict` entries describe cross-domain tensions (e.g. Brain trust vs Ads risk, Operator intent vs Platform Core `BLOCKED`). **Advisory** `recommendation` values: `monitor` | `caution` | `defer` | `proceed` — **not enforced**.

## Advisory recommendation types

`FusionAdvisoryKind`: `proceed`, `proceed_with_caution`, `monitor_only`, `defer`, `blocked_by_dependency`, `insufficient_evidence`.

## Observability

- Logs: `[fusion:system]` for skip/build/persist outcomes.
- `FusionHealthSummary`: subsystem coverage, conflict counts, recommendation mix, observational warnings (missing inputs, high disagreement, empty fusion with data, **malformed normalized signals** (`NaN` scores), **high disagreement rate** vs signal volume, etc.).
- Cross-system conflicts may include: `trust_vs_ads_risk`, `execute_vs_platform_blocked`, `brain_trust_vs_comparison_stability`, `ads_momentum_vs_platform_queue`, and others (see `fusion-system.conflicts.ts`).

## Optional persistence

`FusionSystemSnapshot` Prisma model (`fusion_system_snapshots`) stores JSON payload + health — **not** a source of truth for Brain/Ads/Operator/Platform Core.

## What this system does NOT do

- Execute campaigns, budgets, or platform tasks
- Overwrite Brain weights, Operator recommendations, or Platform Core decisions
- Replace shadow/compare/influence pipelines in those domains

## Validation commands

```bash
cd apps/web
pnpm exec prisma validate --schema=./prisma/schema.prisma
npx vitest run modules/fusion/fusion-system.service.test.ts modules/fusion/fusion-system.influence.test.ts
```

Full-app `tsc` may require high memory in large workspaces.
