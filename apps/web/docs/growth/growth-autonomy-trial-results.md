# Growth Autonomy — adjacent internal trial results measurement

This document describes **what is measured**, **how safety and usefulness are judged**, and **what each governance decision means**. It applies to the **single** operator-approved adjacent internal trial (`internal_review_note_variant`). Nothing here **activates** expansion or new trial types automatically.

## What is measured

Deterministic inputs (in-process for this rollout):

| Signal | Source |
|--------|--------|
| Trial lifecycle | Trial audit trail (`approved`, `execution_completed`, `rollback_completed`, `denied`, …) |
| Exposure proxy | Autonomy monitoring `trialSnapshotsEvaluated` |
| Operator sentiment | Normalized trial feedback (`helpful`, `not_helpful`, `confusing`, `undone_unnecessary`, `rolled_back_problematic`) via `POST /api/growth/autonomy/trial/feedback` |
| Freeze / kill friction | Monitoring `trialKillFreezeBlocks` |

**Sample size** is a conservative composite: feedback rows + approval + execution counts used in `growth-autonomy-trial-results.service.ts`. It is **not** a statistical population — treat it as an internal sanity metric.

## Safety (`safe` / `caution` / `unsafe`)

Implemented in `growth-autonomy-trial-safety-evaluation.service.ts`. Examples of strict signals:

- **Unsafe:** audit gap suspicion (executions ≫ approvals), multiple rollbacks, repeated “problematic rollback” feedback, multiple independent risk reasons.
- **Caution:** single rollback, kill/freeze blocks during window, elevated confusion ratio when volume allows.
- **Safe:** none of the above at caution/unsafe thresholds.

Safety is evaluated **before** usefulness in the narrative copy (and first in code paths conceptually).

## Usefulness bands (`strong` / `good` / `weak` / `poor` / `insufficient_data`)

Implemented in `growth-autonomy-trial-usefulness.service.ts`. Uses:

- Positive / confusion / undo-intent rates from normalized feedback.
- Undo/rollback rate composite from audit + feedback.
- **Sparse-data guard:** low composite sample → `insufficient_data` regardless of stray positives.

**Usage alone does not imply business value** — bands stay conservative when ambiguity is high.

## Final governance decisions

Produced by `resolveGrowthAutonomyTrialDecision` in `growth-autonomy-trial-decision.service.ts`:

| Decision | Meaning |
|----------|---------|
| `rollback` | Conservative posture to treat the trial as failed / reversed from a governance perspective (no automated enforcement outside copy). |
| `insufficient_data` | Do not conclude success or failure — gather more deliberate feedback or wait for volume. |
| `hold` | Safe enough technically but **not** ready to widen; keep internal-only. |
| `keep_internal` | Useful enough to retain as an **internal** assistive signal only. |
| `eligible_for_future_review` | Strong signals + adequate sample + **safe** — may be discussed in **future manual** governance. **Not** activation, **not** expansion, **not** a second trial. |

## Implementation discipline (reminder)

- **Measure only** — one existing adjacent trial lifecycle; **no second trial**, no allowlist mutation, no rollout widening from this surface.
- **`eligible_for_future_review`** — labeling only for possible **future manual** governance; **never** implies activation or expansion unlock in product code.
- **Expansion** — remains **operator-governed** outside this measurement path; the adjacent-trial lock blocks expansion **approvals** in API until measurement exists and continues to enforce **no automatic widening** afterward.

## Why nothing auto-expands

The decision engine emits **metadata only**. Expansion approvals via `/api/growth/autonomy/expansion` remain **blocked** while the adjacent trial governance lock is active (`growth-autonomy-trial-expansion-lock.service.ts`): after the trial executes, operators must complete measurement; afterward, pathways stay **governance-only** — no automatic widening.

## Operator discipline

- Prefer **structured feedback buttons** before inferring usefulness from incidental usage.
- If **sparse data** appears, assume **uncertainty**.
- **`eligible_for_future_review`** requires an explicit human program decision to mean anything beyond “worth a conversation.”

## APIs

| Endpoint | Role |
|----------|------|
| `GET /api/growth/autonomy/trial/results` | Computes/refreshes outcome summary when trial executed; optional monitoring in debug/non-prod. |
| `POST /api/growth/autonomy/trial/feedback` | Records normalized operator feedback (internal cohort). |

## Monitoring

Console prefix: **`[growth:autonomy:trial-results]`** — counters in `growth-autonomy-trial-results-monitoring.service.ts` (never throws).
