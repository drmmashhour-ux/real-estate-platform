# Syria preview policy & approval boundary

This complements [`syria-region-preview-and-identity.md`](./syria-region-preview-and-identity.md).

## Policy (`syria-policy.service`)

`evaluateSyriaPreviewPolicyFromSignals(signals, observation?)` applies **facts first** (on `observation.facts`), then **synthetic signals** (from `buildSyriaSignals`), in a fixed order:

| Input | Decision |
|--------|----------|
| `fraudFlag = true` (fact) | `requires_local_approval` |
| `syriaListingStatus` ∈ {`PENDING_REVIEW`, `pending_review`, …} (fact) | `requires_local_approval` |
| `adapterDisabled` or `unsupportedRegionFeature` (fact) | `blocked_for_region` |
| Any **critical** signal (e.g. fraud pattern) | `requires_local_approval` |
| `payout_anomaly` with **severe** backlog (`payoutPending` high vs `payoutPaid`) | `requires_local_approval` |
| `payout_anomaly` otherwise | `caution_preview` |
| `low_booking_activity` or `inactive_listing` (any severity) | `caution_preview` |
| Any other **warning**-severity signal | `caution_preview` |
| Otherwise | `allow_preview` |

Severe payout uses a fixed minimum pending count and compares pending to paid (see `PAYOUT_REQUIRES_APPROVAL_PENDING_MIN` in `syria-policy.service.ts`).

Types live in `syria-policy.types.ts`. Output is advisory — **no FSBO / Québec rule engine**.

## Approval boundary (`syria-approval-boundary.service`)

`evaluateSyriaApprovalBoundary` layers **platform posture** on top of policy:

- **`liveExecutionBlocked`**: always `true` for Syria listings in default `apps/web` posture (read-only adapter; opt-in flags control any future live internal actions).
- **`requiresHumanApprovalHint`**: `true` when policy is `requires_local_approval` or `caution_preview`.

## Explainability (`syria-preview-explainability.service`)

Deterministic structured lines + bullets merge into:

- Listing preview `explainability.notes`
- Optional `previewExplanation` graph when `FEATURE_AUTONOMY_PREVIEW_EXPLAINABILITY_V1` is on
- Tags in `syria-preview-explainability-rules.ts` for dashboards / logs

## Dashboard slice (`syriaPolicySummary`)

`buildSyriaPolicySummarySlice` in `global-dashboard.service` derives a **worst-case policy label** from aggregate SQL counts (fraud-flagged → critical proxy; pending review → caution proxy). This is **not** a substitute for per-listing `evaluateSyriaPreviewPolicyFromSignals`.

## Governance review lane (`syriaGovernanceSlice`)

`resolveSyriaGovernanceReviewType` maps facts + signals to **`risk_review`**, **`admin_review`**, or **`standard`** (modeled only — no Syria-app persistence, no workflow execution):

| Condition | `reviewType` |
|-----------|----------------|
| `fraudFlag` | `risk_review` |
| `payout_anomaly` signal | `risk_review` |
| Pending listing (`syriaListingStatus` → pending review) | `admin_review` |
| Otherwise | `standard` |

Preview responses also expose **`syriaPolicyDecision`** (policy + `reviewType`), **`syriaPreviewNotes`**, **`syriaGovernanceExplainability`**, and **`executionUnavailableForSyria: true`**.

The marketplace dashboard adds **`syriaGovernanceSlice`** (`requiresApprovalCount`, `fraudFlaggedCount`, `blockedForRegionCount`, `previewableCount`) from regional SQL aggregates — see slice `notes` for overlap / semantics. Intentionally **not** implemented here: Syria-side execution, Syria writes, Syria-specific detectors beyond current scope, or durable approval stores in the Syria app.
