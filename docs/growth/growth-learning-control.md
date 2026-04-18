# Governance + Learning Control

## Purpose

A **read-only control plane** that sits above the growth learning cycle and answers:

- Is it safe to keep **adaptive weight updates** running?
- Should operators **monitor**, **freeze** updates, or **plan a manual reset** of local weights?
- What **signals** drove that conclusion?

It does **not** enforce resets, freeze production systems, or mutate Stripe, bookings, checkout, pricing, ads execution, or CRO core logic.

## States

| State | Meaning |
|--------|---------|
| `normal` | Conservative bounds satisfied; adaptive updates may proceed when other learning gates allow. |
| `monitor` | Weak evidence or thin signal count — keep adaptive updates under supervision. |
| `freeze_recommended` | Stop **automatic weight nudges** this cycle (advisory gate inside `runGrowthLearningCycle`). |
| `reset_recommended` | Local weights have drifted to the cap — **human** should revert to defaults (no auto-reset). |

## Thresholds (see `growth-governance-learning.constants.ts`)

- **Negative outcome rate** — freeze when too high.
- **Insufficient-data rate** — freeze when too high; monitor when moderately high.
- **Weight drift** — reset recommended when drift reaches the cap (`GGL_MAX_WEIGHT_DRIFT`).
- **Governance** — freeze when governance implies high risk (e.g. human review / freeze status or high-severity risks).
- **Autopilot execution failures** — freeze when cumulative failures exceed a small cap.
- **Minimum signals** — monitor when evaluated signal count is below `GGL_MIN_SIGNALS_REQUIRED`.

## Decision rules

Rules are **deterministic** and ordered: **reset_recommended** (drift) takes precedence over freeze conditions; **monitor** applies when no freeze/reset trigger fires but evidence is weak.

## Integration

`runGrowthLearningCycle()`:

1. Evaluates learning outcomes (as before).
2. Builds a `computeGrowthLearningControlDecision()` snapshot from summary, insufficient-data share, current weights, optional governance decision, and autopilot execution counters.
3. **Skips `applyGrowthWeightAdjustments`** when state is `freeze_recommended` or `reset_recommended` (even if `FEATURE_GROWTH_LEARNING_ADAPTIVE_WEIGHTS_V1` is on).
4. **Never** auto-resets weights; reset remains a **recommendation** only.
5. Appends advisory **warnings** to the learning summary when control is non-normal.

## Monitoring

`growth-governance-learning-monitoring.service.ts` logs `[growth:governance:learning]` with state and key signals (best-effort; never throws).

## Safety guarantees

- **No automatic enforcement** of freeze or reset outside the learning weight path.
- **Source systems stay authoritative** — CRM, payments, and campaign platforms are unchanged.
- **Human review** expected before reverting weights or changing operational policy.

## Validation

```bash
cd apps/web && npx vitest run modules/growth/__tests__/growth-governance-learning.service.test.ts
```
