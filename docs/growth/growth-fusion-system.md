# Growth Fusion System (V1)

## Purpose

Growth Fusion is a **read-only orchestration layer** that aggregates signals from existing growth modules (leads, ads performance, CRO V8 bundle, content hub drafts, AI autopilot actions, and influence suggestions), runs **deterministic** cross-source analysis, and outputs a **unified priority list** for operators.

Fusion is **not execution**: it does not change Stripe, bookings, checkout, pricing, Brain source-of-truth, ads APIs, or CRO mutators. Real changes still flow through existing approval and policy paths.

## Architecture

```
buildGrowthFusionSnapshot()  →  analyzeGrowthFusion()  →  prioritizeGrowthFusionActions()
         ↑                                                              ↓
   existing modules                                              buildGrowthFusionSystem()
```

- **Snapshot** (`growth-fusion-snapshot.service.ts`): async read-only aggregation; collects warnings when a submodule is unavailable.
- **Analyzer** (`growth-fusion-analyzer.service.ts`): pure functions; no LLM; emits `GrowthFusionSummary` (status, grouped signals, top problems/opportunities/actions).
- **Prioritizer** (`growth-fusion-prioritizer.service.ts`): maps signals and summary lines into `GrowthFusionAction[]` with `priorityScore` 0–100, sorted descending, capped (typically top 8).
- **Orchestrator** (`growth-fusion.service.ts`): `buildGrowthFusionSystem()` — returns `null` when `FEATURE_GROWTH_FUSION_V1` is off.
- **Monitoring** (`growth-fusion-monitoring.service.ts`): in-process counters + `[growth:fusion]` JSON logs (stdout).

## Source modules (read-only)

| Area      | Source |
|-----------|--------|
| Leads     | `prisma.lead` counts (total + last 7d) |
| Ads       | `getAdsPerformanceSummary`, `getAdsPerformanceByCampaign` |
| CRO       | `runCroV8OptimizationBundle` |
| Content   | `buildContentHub` draft counts when content-assist flags allow |
| Autopilot | `buildAutopilotActions()` |
| Influence | `buildInfluenceSuggestions` (from ads summary + campaigns) |

## How priorities are computed

1. **Signals** inherit a baseline `priorityScore` via the same `computePriorityScore` blend used elsewhere in autopilot (impact × confidence × band).
2. **Actions** use `computeFusionActionPriorityScore` in the prioritizer: impact points + confidence + per-source weight + optional signal tail + revenue-blocking bonus for CRO/ads capture issues.
3. Results are **sorted descending** and **truncated** to a small set so the UI stays scannable.

## Bridge rules (optional)

All bridges are **gated by separate env flags** (default off):

| Flag | Module |
|------|--------|
| `FEATURE_GROWTH_FUSION_AUTOPILOT_BRIDGE_V1` | `growth-fusion-autopilot-bridge.service.ts` — maps fusion actions to advisory-shaped autopilot rows (`[Fusion]` title prefix, `advisory_snapshot`). Does not persist or approve. |
| `FEATURE_GROWTH_FUSION_CONTENT_BRIDGE_V1` | `growth-fusion-content-bridge.service.ts` — when a content gap is detected, returns **recommendations** only (open Content Studio for drafts). |
| `FEATURE_GROWTH_FUSION_INFLUENCE_BRIDGE_V1` | `growth-fusion-influence-bridge.service.ts` — splits high-priority actions into **CRO vs ads** hint lists for advisory panels. |

Bridges are exposed in `GET /api/growth/fusion` under `bridges` when the master fusion flag is on.

## Feature flags

| Env | Default | Behavior when off |
|-----|---------|-------------------|
| `FEATURE_GROWTH_FUSION_V1` | off | `buildGrowthFusionSystem()` returns `null`; API 403; dashboard panel hidden. |
| `FEATURE_GROWTH_FUSION_AUTOPILOT_BRIDGE_V1` | off | No `fusionBackedAutopilot` rows in API. |
| `FEATURE_GROWTH_FUSION_CONTENT_BRIDGE_V1` | off | `content` bridge key is `null`. |
| `FEATURE_GROWTH_FUSION_INFLUENCE_BRIDGE_V1` | off | `influence` bridge key is `null`. |

## Safety guarantees

- No payments, bookings, or pricing logic touched.
- No Brain weight / outcome overwrites.
- No ad-platform API calls from fusion.
- No outbound messaging from fusion.
- No automatic execution of ads or CRO changes; fusion output is **advisory** and **opt-in** via flags.
- Snapshot path performs **no writes** to business tables for fusion itself.

## UI

When `FEATURE_GROWTH_FUSION_V1` is enabled, `GrowthMachineDashboard` renders `GrowthFusionPanel`, which loads `GET /api/growth/fusion`.

## Validation commands

From `apps/web`:

```bash
npx vitest run modules/growth/__tests__/growth-fusion-analyzer.service.test.ts
npx vitest run modules/growth/__tests__/growth-fusion-prioritizer.service.test.ts
npx vitest run modules/growth/__tests__/growth-fusion-snapshot.service.test.ts
npx vitest run modules/growth/__tests__/growth-fusion.service.test.ts
npx vitest run modules/growth/__tests__/growth-fusion-monitoring.service.test.ts
```

## Future phases (not implemented here)

- Stronger fusion → autopilot merge with explicit operator opt-in per row.
- Fusion-backed content automation (still draft/review-first).
- Fusion-backed campaign intelligence (read-only scoring before any action).
- Fusion-backed growth governance (cross-team approvals).

---

**Fusion is not execution.** Source systems remain authoritative; execution remains behind approval and policy.
