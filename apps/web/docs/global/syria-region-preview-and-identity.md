# Syria region preview & listing identity (apps/web)

Read-only intelligence for **Darlink / `syria_*`** data surfaced in LECIPM admin and global dashboards. No writes to Syria from `apps/web`; execution remains blocked unless explicitly feature-flagged elsewhere.

**Governance modeling, trust copy & dashboard semantics:** [syria-governance-trust-and-dashboard.md](./syria-governance-trust-and-dashboard.md).

## Preview pipeline (`autonomous-marketplace.engine`)

For `previewForListing({ listingId, source: "syria", regionCode })`, `previewForSyriaListing`:

1. Loads observation via `buildSyriaListingObservationSnapshot`.
2. Builds **Syria signals** (`buildSyriaSignals`) and **policy** (`evaluateSyriaPreviewPolicyFromSignals`).
3. Builds **approval boundary** (`evaluateSyriaApprovalBoundary`) — always `liveExecutionBlocked: true` in default web posture.
4. Emits **preview notes** (`buildSyriaPreviewNoteLines`), **governance explainability** lines, **structured explainability** (`buildSyriaPreviewStructuredExplainability`: policy tags, boundary, signal severities, **identity scope** lines).
5. Merges bullets into top-level **`explainability.notes`** and optional **`previewExplanation`** (when explainability flags are on).
6. Returns **`executionResult.status: DRY_RUN`** only — never the controlled execution orchestrator.

**Policy & boundary details** (signal → decision matrix, approval boundary): [syria-policy-and-approval-boundary.md](./syria-policy-and-approval-boundary.md).

## Listing identity (stable keys)

When `FEATURE_REGION_LISTING_KEY_V1` is on, responses include **`regionListingRef`** (e.g. `sy:syria:<listingId>` / display id). Structured explainability adds `syria_explainability_identity_scope` tags so operators can correlate preview rows with unified intelligence without exposing raw DB payloads.

## Admin API: `GET /api/admin/autonomy/preview`

With `source=syria` (or `regionListingKey` resolving to Syria), JSON includes **`syriaPreviewEnrichment`**:

| Field | Purpose |
|-------|---------|
| `policy` | `syriaPolicyPreview` |
| `approvalBoundary` | `syriaApprovalBoundary` |
| `syriaPolicyDecision` | Envelope + review type |
| `syriaPreviewNotes` / `syriaGovernanceExplainability` | Operator lines |
| `syriaStructuredExplainability` | Full structured lines + bullets |
| `structuredLinesSample` / `bulletsSample` | Trimmed copies for dashboards |
| `explainabilityNotesSample` | First notes from merged explainability |

## Dashboard slices

- **`syriaPolicySummary`** (`buildSyriaPolicySummarySlice`): aggregate SQL proxies → `worstCasePolicy`, **`requiresHumanReviewLikely`**, `liveExecutionBlocked: true`, notes.
- **`syriaGovernanceSlice`**: counts for governance visibility (not workflow execution).

**Source of truth for per-listing posture** remains the preview engine + policy service, not dashboard aggregates alone.

## UI

**`SyriaPreviewPanel`** (admin intelligence): shows policy decision, approval boundary (codes + human-readable gloss via `syriaApprovalReasonDisplay`), governance explainability, structured explainability tags, signals, opportunities, and merged explainability summary.
