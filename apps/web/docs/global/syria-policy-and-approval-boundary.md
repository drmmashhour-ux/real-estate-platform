# Syria preview policy & approval boundary

This complements [`syria-region-preview-and-identity.md`](./syria-region-preview-and-identity.md) and [`syria-governance-trust-and-dashboard.md`](./syria-governance-trust-and-dashboard.md).

## Policy (`syria-policy.service`)

Canonical **signal → decision** summary:

| Signal | Result |
| --- | --- |
| `fraudFlag = true` | `requires_local_approval` |
| Listing status pending review (`syriaListingStatus` facts: `PENDING_REVIEW`, `pending_review`, …) | `requires_local_approval` |
| Payout inconsistency (`payout_anomaly`) | **`caution_preview`** or **`requires_local_approval`** (severe backlog vs mild — see thresholds in code) |
| Weak bookings / inactive listing (`low_booking_activity`, `inactive_listing`) | `caution_preview` |
| Unsupported feature / adapter off (`unsupportedRegionFeature`, `adapterDisabled`) | `blocked_for_region` |
| Otherwise | `allow_preview` |

**Implementation order** (first match wins): blocked region → fraud → pending review → **any critical-severity synthetic signal** → payout anomaly → weak/inactive → **first remaining warning-severity signal** → allow.

Severe payout uses `PAYOUT_REQUIRES_APPROVAL_PENDING_MIN` and compares `payoutPending` vs `payoutPaid` in `syria-policy.service.ts`.

Types live in `syria-policy.types.ts`. Output is advisory — **no FSBO / Québec rule engine**.

## Approval boundary (`syria-approval-boundary.service`)

`evaluateSyriaApprovalBoundary` layers **platform posture** on top of policy:

- **`liveExecutionBlocked`**: always `true` for Syria listings in default `apps/web` posture (read-only adapter; opt-in flags control any future live internal actions).
- **`requiresHumanApprovalHint`**: `true` when policy is `blocked_for_region`, `requires_local_approval`, or `caution_preview`; `false` only for `allow_preview`.

## Explainability (`syria-preview-explainability.service`)

Deterministic structured lines + bullets merge into:

- Listing preview `explainability.notes`
- Optional `previewExplanation` graph when `FEATURE_AUTONOMY_PREVIEW_EXPLAINABILITY_V1` is on
- Tags in `syria-preview-explainability-rules.ts` for dashboards / logs

## Dashboard slice (`syriaPolicySummary`)

`buildSyriaPolicySummarySlice` in `global-dashboard.service` derives a **worst-case policy label** from aggregate SQL counts (fraud-flagged → `requires_local_approval` proxy; pending review → same). It also sets **`requiresHumanReviewLikely`** when `worstCasePolicy !== "allow_preview"`. This is **not** a substitute for per-listing `evaluateSyriaPreviewPolicyFromSignals`.

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
