# Real preview + explainability (DRY_RUN)

## What it does

When `FEATURE_AUTONOMY_REAL_PREVIEW_V1` is enabled, `AutonomousMarketplaceEngine.previewForListing()` runs a deterministic pipeline:

1. `buildListingObservationSnapshot(listingId)` — read-only metrics (views, bookings, conversion proxy, status, price).
2. Observation envelope built from FSBO listing facts (still read-only).
3. `buildPreviewSignalsForListing(listingId, observation)` — metric-derived `MarketplaceSignal`s only.
4. `buildPreviewOpportunitiesFromSignals(signals, observation)` — up to five explainable opportunities with evidence links.
5. `evaluatePreviewPoliciesForListing(...)` — preview listing policy rules only (no governance execution).
6. `buildPreviewActions(...)` — up to five `CREATE_TASK` proposals marked `previewExecution: DRY_RUN`.
7. `buildPreviewExplanation(...)` when `FEATURE_AUTONOMY_PREVIEW_EXPLAINABILITY_V1` — summary, ≤5 findings, ≤5 recommendations, bounded graph (≤25 nodes, ≤35 edges).

## What it does not do

- No writes to the database from preview.
- No executor dispatch, billing, promotions, or pricing automation.
- No LLM or probabilistic language — copy is fixed and auditable.

## DRY_RUN guarantees

- `executionResult.status` remains `"DRY_RUN"`.
- Proposed actions carry `metadata.previewExecution = "DRY_RUN"` (and pipeline metadata).
- Policy outcomes are advisory; `preview_pipeline_disposition` rows annotate preview posture (`allow` / `caution` / `blocked_in_preview`).

## Explanation graph structure

Nodes may reference metrics, signals, opportunities, policy rows, and preview actions. Edges carry deterministic textual reasons linking evidence to interpretation. Duplicate nodes are suppressed by id to keep admin payloads stable.
