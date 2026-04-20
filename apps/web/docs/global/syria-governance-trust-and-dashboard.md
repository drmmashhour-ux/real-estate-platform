# Syria governance modeling, trust copy & dashboard visibility

Companion to [syria-region-preview-and-identity.md](./syria-region-preview-and-identity.md) and [syria-policy-and-approval-boundary.md](./syria-policy-and-approval-boundary.md).

## 1. Governance lane (`reviewType`) — modeled only

`resolveSyriaGovernanceReviewType` maps facts + signals to a **review lane label**. Nothing is executed or persisted in the Syria app from this mapping — it is **visibility and alignment** for operators.

| Condition | `reviewType` |
| --- | --- |
| `fraudFlag` | `risk_review` |
| Payout issues (`payout_anomaly` in signals) | `risk_review` |
| Pending listing (`syriaListingStatus` → pending review) | `admin_review` |
| Normal approval case | `standard` |

**Precedence:** fraud → pending listing → payout anomaly → standard (see `syria-governance-review.service.ts`).

**Outcome:** you can discuss **DATA → DECISIONS → GOVERNANCE VISIBILITY** without implying automation or Syria-side writes.

---

## 2. Preview payload (trust surfaces)

Syria preview responses carry **policy**, **boundary**, **notes**, and explicit **execution posture**:

Includes (among other fields):

- `syriaPolicyDecision` — policy envelope + **`reviewType`**
- `syriaApprovalBoundary` — human hint + reasons + live execution blocked
- `syriaPreviewNotes` — advisory lines
- `executionUnavailableForSyria: true` — web scope does not execute against Syria listings in this phase

Structured explainability (`syriaStructuredExplainability`, governance lines, merged `explainability`) adds **deterministic** operator copy — no LLM.

---

## 3. Explainability examples (deterministic, from `syria-governance-explainability.service`)

These illustrate **trust + clarity** (exact wording may evolve in code; intent is stable):

1. *"Execution is unavailable for the Syria region in this phase."*
2. *"This Syria listing is previewable but requires local approval before any automation."* (when `requiresHumanApprovalHint`)
3. *"Fraud flag requires local admin review."* (when fraud fact)
4. Additional lines for payout risk and `admin_review` lane when applicable.

Regional block uses a separate blocked-region message — see service for full branching.

---

## 4. Dashboard slices (`SyriaGovernanceDashboardSlice`)

Aggregate **SQL proxies** over `syria_*` (not a sum of per-listing preview runs):

| Field | Meaning (high level) |
| --- | --- |
| `requiresApprovalCount` | Pending-review + fraud-flag overlap possible — see slice `notes` |
| `fraudFlaggedCount` | Fraud-flagged listings |
| `blockedForRegionCount` | Listings counted in regional scope where execution path is blocked in phase |
| `previewableCount` | Listings in dry-run / preview scope |

Together with **`syriaPolicySummary`** and **`syriaSignalRollup`**, the dashboard expresses **metrics → posture → governance hints**, not raw counts alone.

---

## 5. Remaining limitations (intentional)

Not in scope at this stage:

- Syria **execution** from `apps/web`
- Syria **writes** / Darlink mutations from LECIPM admin
- Syria-native **detectors** (preview still mixes FSBO detector empty-state notes where applicable)
- Syria-specific **growth optimization** automation
- **Durable approval persistence** inside the Syria app — governance labels are modeled in web responses only unless separately implemented

---

## 6. What this composes

Multi-region posture with:

- Unified intelligence (read models)
- Region identity (stable keys where enabled)
- Preview (deterministic dry-run / signals / policy)
- Region policy layer (`evaluateSyriaPreviewPolicyFromSignals`)
- Approval boundary modeling (`evaluateSyriaApprovalBoundary`)
- Explainability (deterministic strings + structured tags)
- Dashboard visibility (aggregates + governance slice)

All of the above are **advisory and read-only** in `apps/web` unless a future flag explicitly enables a bounded execution path elsewhere.
