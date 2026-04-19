# Marketplace flywheel — action tracking & outcome learning

Admin/internal **tracking and learning only**. This layer does **not**:

- Run campaigns or automations  
- Connect to ads or spend systems  
- Modify Stripe, revenue engines, checkout, or pricing engines  

---

## Action lifecycle

| Status | Meaning |
|--------|---------|
| `proposed` | Operator logged intent (default on create). |
| `acknowledged` | Recognized / queued for follow-through. |
| `in_progress` | Work underway (manual CRM discipline). |
| `completed` | Operator marked done (does not imply metric success — check outcomes). |
| `abandoned` | Explicitly dropped. |

Transitions are manual via API/UI only. Nothing auto-advances status.

---

## Baseline snapshot (at creation)

When an action is created, the server captures a **rolling 30-day** snapshot aligned with `collectFlywheelMarketplaceMetrics()`:

- Broker count (role `BROKER`)
- Leads created in last 30 days
- Active approved FSBO listings
- **Unlock rate** (unlocks / leads30)
- **Conversion rate** here = pipeline win rate (won|closed / leads30) — same definitions as flywheel insights

Stored on the row for objective later comparison.

---

## Outcome measurement

`evaluateFlywheelOutcome(actionId)`:

1. Recomputes **current** `collectFlywheelMarketplaceMetrics()`.
2. Computes **deltas** vs baseline (counts and rates).
3. Applies **deterministic scoring** (`flywheel-outcome-scoring.service.ts`).
4. Appends one **`marketplace_flywheel_action_outcomes`** row (audit trail; re-run creates another snapshot).

Rolling windows move over time — comparisons are **descriptive snapshots**, not causal attribution.

---

## Outcome scores (exact rules v1)

| Score | When |
|-------|------|
| `insufficient_data` | Fewer than **7 whole days** since action creation **or** lead volume too thin for stable rate comparisons (rates need ≥ **10** leads in baseline **and** current 30d window where applicable). |
| `positive` | **Broker acquisition:** brokers **+2** or more. **Demand:** leads30 up by ≥ `max(5, ceil(8% of baseline leads30))`. **Supply:** listings **+2** or more. **Conversion/pricing:** unlock rate up by ≥ **2.5 percentage points** (or secondary win-rate uplift ≥ 2.5 pp for conversion actions only). |
| `negative` | Broker **−1** or worse; demand lead delta meaningfully negative (same magnitude as positive threshold); listings **−2** or worse; unlock rate down ≤ **−2.5 pp** when rates are usable. |
| `neutral` | Otherwise (small or mixed movement). |

Revenue delta is reserved **null** in v1 — no payout coupling.

---

## Learning aggregates (hints only)

`summarizeFlywheelLearning()` returns:

**`byInsightType`** (one row per insight family `broker_gap` … `pricing_opportunity`):

| Field | Meaning |
|-------|---------|
| `similarActionsCount` | All DB actions whose `insightType` matches (any status). |
| `completedActionsCount` | Actions with `status === completed`. |
| `successRate` | `positive / (positive + neutral + negative)` on latest 500 outcomes joined to actions of that insight type; **`null`** if denominator is 0. |
| `confidence` | `high` ≥12 scored outcomes, `medium` ≥5, else `low`. |
| `lastOutcomeScore` / `lastOutcomeExplanation` | Most recent outcome row globally among actions of that insight type (by `measuredAt`). |

**`actionTypeEffectiveness`** (one row per distinct `MarketplaceFlywheelAction.type`):

| Field | Meaning |
|-------|---------|
| `evaluatedOutcomes` | Outcomes with non–`insufficient_data` scores for that action type. |
| `positiveShare` | `positive / (positive + neutral + negative)` for that action type. |

Used for UI hints only — **no automation**.

---

## Monitoring

Console logs use prefix **`[growth:flywheel]`** for creates, status updates, evaluations, and outcome buckets — handlers never throw from monitoring helpers.
