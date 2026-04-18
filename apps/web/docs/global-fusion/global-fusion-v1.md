# Global Fusion V1

## Purpose

**Global Fusion V1** is a read-only advisory layer that unifies **Brain, Ads, CRO, and Ranking** signals from the existing **AI Control Center** aggregate (`loadAiControlCenterPayload`). It does not replace Fusion System V1, source engines, or stored truth.

## Systems included

| Source   | Provenance |
|----------|------------|
| Brain V8 | `ai_control_center:brain` |
| Ads V8   | `ai_control_center:ads` |
| CRO V8   | `ai_control_center:cro` |
| Ranking V8 | `ai_control_center:ranking` |

## Normalization model

`normalizeControlCenterSystems` maps each subsystem summary to one `GlobalFusionNormalizedSignal` with bounded metrics, `reason[]`, `blockers[]`, and provenance strings. Missing or partial fields degrade safely.

## Scoring model

Local weights (brain 0.28, ads 0.24, cro 0.26, ranking 0.22) produce fused confidence, priority, risk, actionability, agreement, and evidence scores. **Native subsystem scores are never modified.**

## Conflict model

Heuristic cross-system conflicts (e.g. Ads favorable vs CRO weak, Ranking expand vs Brain strain). Each has `severity`, `summary`, and advisory `recommendation` (`proceed`, `proceed_with_caution`, `monitor_only`, `defer`, `require_human_review`). **No enforcement.**

## Recommendation model

Advisory kinds such as `fix_funnel_first`, `expand_ranking_cautiously`, `defer_until_evidence`, `require_human_review`. Each lists which systems agree/disagree in summary form.

## Flags

| ENV | Code flag |
|-----|-----------|
| `FEATURE_GLOBAL_FUSION_V1` | `globalFusionFlags.globalFusionV1` |
| `FEATURE_GLOBAL_FUSION_PERSISTENCE_V1` | `globalFusionPersistenceV1` |
| `FEATURE_GLOBAL_FUSION_INFLUENCE_V1` | `globalFusionInfluenceV1` |
| `FEATURE_GLOBAL_FUSION_PRIMARY_V1` | `globalFusionPrimaryV1` |

All default **off**. When `GLOBAL_FUSION_V1` is off, `buildGlobalFusionPayload` returns a disabled payload without calling the control center.

Persistence V1 currently **logs a stub only** (no Prisma table).

Influence / Primary flags are recorded in payload meta for future presentation scaffolding only.

## Observability

Namespace: `[global:fusion]`. Logs payload summary, missing sources, malformed signals, and health warnings. **Observational only.**

## Rollback

Disable `FEATURE_GLOBAL_FUSION_V1` — fusion compute and Growth UI strip hide. No source data migration.

## What fusion does NOT do

- Auto-execute recommendations  
- Change Brain / Ads / CRO / Ranking writers or stored outcomes  
- Replace financial or dependency truth  
- Fabricate metrics  

## Validation

```bash
cd apps/web && pnpm exec vitest run modules/global-fusion --reporter=dot
```

Optional: `pnpm exec tsc -p apps/web --noEmit` (may be heavy).
