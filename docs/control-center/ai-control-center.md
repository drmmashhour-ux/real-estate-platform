# AI Control Center (executive governance)

## Purpose

The **AI Control Center** is a **read-only** admin surface that aggregates governance signals from major LECIPM AI subsystems in one place: Brain V8, Ads V8, CRO V8, Ranking V8, Operator V2, Platform Core V2, Fusion, the autonomous **Global AI Growth Loop** (Autonomous Growth runs), and Swarm flags/status.

It is **decision-support only**: it does not execute actions, toggle feature flags, or mutate source-of-truth state.

## Enablement

- **Environment:** `FEATURE_AI_CONTROL_CENTER_V1=true`
- **Code:** `controlCenterFlags.aiControlCenterV1`
- When **off:** the admin page returns **404** and `GET /api/admin/control-center` returns **404**.

## Systems included

| Area | Data sources (best-effort) |
|------|----------------------------|
| Brain V8 | In-process comparison report, shadow/primary monitoring snapshots, `oneBrainV8Flags` |
| Ads V8 | Ads V8 comparison aggregation snapshot, `adsAiAutomationFlags` |
| CRO V8 | `runCroV8OptimizationBundle` when `FEATURE_CRO_V8_ANALYSIS_V1` is on |
| Ranking V8 | `loadRankingV8GovernancePayload` (shadow observations + scorecard) |
| Operator V2 | `operatorV2Flags` (execution plan, simulation, conflicts, priority) |
| Platform Core V2 | `getPlatformCoreHealth`, scheduler/dependency counts when enabled |
| Fusion | `buildFusionSnapshotV1` when orchestration is active |
| Growth loop | Recent `AutonomousGrowthRun` rows |
| Swarm | `swarmSystemFlags` (full swarm cycle is not run on this page) |

## Status meanings

Unified per-card status:

- **healthy** — signals look nominal for available data.
- **limited** — partial coverage, cold instance, or soft degradation.
- **warning** — heuristic thresholds or subsystem warnings.
- **critical** — strong negative signals (e.g. governance rollback recommendation, severe fusion conflicts).
- **disabled** — subsystem flags off by design.
- **unavailable** — timed out, error, or missing dependency.

Missing optional metrics stay **null** or **—** in the UI; they are **not** invented.

## Executive summary

Derived heuristically from:

- Per-system unified status buckets (healthy / warning / critical counts).
- Ranking governance recommendation and rollback flags.
- Unified warning list (Platform Core health, Brain/Ads/Ranking hints).

**Top opportunities / risks** are **explicit, non-prescriptive** strings assembled from those signals (e.g. candidate_for_primary, elevated fallback rate, platform backlog).

## Rollout labels (primary / shadow / influence / blocked)

- **Primary / shadow / influence** lists name systems whose **env flags** indicate that posture (e.g. `FEATURE_BRAIN_V8_PRIMARY_V1`, shadow evaluators, influence layers). They describe **configuration intent**, not a live mutation from this UI.
- **Blocked / backlog** lists advisory gates (e.g. Ranking blocking reasons) or Platform Core blocked decision counts when present.

## Limitations

- In-memory aggregates (Brain/Ads comparison) are **empty on cold serverless** instances until traffic produces comparisons.
- Swarm **does not** run a full multi-agent cycle on page load (would be heavy); the page shows flags and static guidance.
- CRO/Fusion/Ranking queries are **time-bounded** internally; timeouts appear in `meta.missingSources`.
- Full-repo **TypeScript** may require extra heap in large workspaces.

## API

`GET /api/admin/control-center?days=&limit=&offsetDays=` — requires admin session; returns JSON payload when the feature flag is on.

## Validation commands

```bash
pnpm exec vitest run modules/control-center/ app/api/admin/control-center/route.test.ts
```

Optional (if memory allows):

```bash
pnpm exec tsc --noEmit -p apps/web/tsconfig.json
```

## UI route

`/[locale]/[country]/admin/control-center` — requires `FEATURE_AI_CONTROL_CENTER_V1` and admin control access.
