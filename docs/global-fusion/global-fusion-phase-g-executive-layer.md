# Global Fusion Phase G — Executive operating layer

## Purpose

Phase G exposes a **read-only executive coordination layer** on top of Global Fusion: company-level **summaries, priorities, risks, readiness, and rollout health** derived from existing Fusion primary output, Phase D monitoring, Phase E learning signals, and Phase F governance. It is intended for **Company Command Centers**, Swarm oversight, Global Growth Loop views, governance dashboards, and executive reporting — as **advisory inputs only**.

## What it aggregates

- **Fusion primary / payload** (`GlobalFusionPayload`, primary surface when available): opportunities, risks, recommendations, conflicts, scores, health.
- **Phase D** aggregate rates: fallback, missing sources, conflict, anomaly, unstable ordering, etc.
- **Phase F** last governance snapshot (when governance flag is on).
- **Phase E** learning health slice (when learning flag is on).
- **Fusion-local freeze state** (Phase F).

It does **not** query Brain/Ads/CRO/Ranking stores directly; it **reads** the same in-process Fusion artifacts the rest of Global Fusion already uses.

## What it does and does NOT do

**Does:**

- Produce **explainable**, **source-grounded** executive priorities, themes, risks, blockers, and narratives.
- Optionally emit a **stable feed payload** (`buildGlobalFusionExecutiveFeed`) when `FEATURE_GLOBAL_FUSION_EXECUTIVE_FEED_V1` is on.
- Optionally retain **process-local** snapshots when `FEATURE_GLOBAL_FUSION_EXECUTIVE_PERSISTENCE_V1` is on (in-memory ring buffer; not a source-of-truth store).

**Does not:**

- Replace or overwrite **source-system truth**.
- **Auto-execute** business or product actions.
- Modify Brain/Ads/CRO/Ranking **native logic** or stored weights/outcomes/financial/dependency data.
- **Auto-toggle** unrelated rollout flags.
- Act as a hidden write path into other systems.

## Executive theme model

Themes (see `GlobalFusionExecutiveThemeId`) include labels such as: growth acceleration, stability first, launch readiness, governance attention, evidence gap, operational blocker, ranking expansion (cautious), funnel first, human review required. They are **heuristic mappings** from Fusion recommendation kinds, primary buckets, and governance — not autonomous strategy.

## Risk / blocker model

**Risks** combine Phase D thresholds, governance escalation, snapshot risks, and learning linkage weakness. **Blockers** include Fusion-local freeze, conflict-derived items, and health coverage gaps. Severity and ranking are **observational** for attention routing, not automated incident response.

## Feed contract

`buildGlobalFusionExecutiveFeed()` returns `null` when `FEATURE_GLOBAL_FUSION_EXECUTIVE_FEED_V1` is off. When on, it returns a stable object: `summary`, mirrored top lists, `rolloutSummary`, `healthSummary`, `warnings`, `provenance`, and `meta` (version, flags, weak-evidence / missing-source hints). Consumers should treat payloads as **read-only** and tolerate **partial** data.

## Observability / logging

Namespace: **`[global:fusion:executive]`**. Counters and helpers live in `global-fusion-executive-monitoring.service.ts` (`getExecutiveMonitoringSummary`). Warnings (weak evidence, many priorities, blocker concentration) are **observational only**.

## Rollback / disable steps

1. Set **`FEATURE_GLOBAL_FUSION_EXECUTIVE_LAYER_V1=0`** (and optionally **`FEATURE_GLOBAL_FUSION_EXECUTIVE_FEED_V1=0`**, **`FEATURE_GLOBAL_FUSION_EXECUTIVE_PERSISTENCE_V1=0`**).
2. Restart or redeploy so env takes effect.
3. No database migration is required for the default in-memory persistence stub.

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/global-fusion/global-fusion-executive.service.test.ts
cd apps/web && pnpm exec vitest run modules/global-fusion/global-fusion-executive-priority.test.ts
cd apps/web && pnpm exec vitest run modules/global-fusion/global-fusion-executive-risk.test.ts
cd apps/web && pnpm exec vitest run modules/global-fusion/global-fusion-executive-feed.test.ts
cd apps/web && pnpm exec vitest run modules/global-fusion/global-fusion-executive-monitoring.test.ts
cd apps/web && pnpm exec vitest run modules/global-fusion
```

---

**Note:** Source systems remain authoritative. The executive layer is a **read-only coordination / summarization** layer over Fusion-local signals.
