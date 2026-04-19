# Fast Deal city comparison (internal)

## What is compared

For each **city label** in a fixed or query-provided list, the engine aggregates **existing** Fast Deal rows in a time window:

- **Broker sourcing:** `broker_sourcing` events with matching `metadata.city`.
- **Landing captures:** `landing_capture` `lead_submitted` with matching `metadata.marketVariant`.
- **Playbook:** `closing_playbook` events with matching `metadata.city` (operators set the city field on the playbook panel when logging).
- **Outcomes:** `fast_deal_outcomes` rows with matching `metadata.city` or `metadata.marketVariant`.

City matching uses **normalized keys** (`normalizeFastDealCityKey`): NFKC, trim, lowercase.

## What is NOT compared

- Anything without **explicit** city attribution in metadata is **not** folded into a city bucket (no guessing from lead IDs or payments).
- **Stripe, checkout, bookings, payouts** — not wired here by design.

## Derived metrics

Only when numerators/denominators exist and denominators **> 0**:

| Ratio | Formula |
|-------|---------|
| captureRate | `leadsCaptured / sourcingSessions` |
| playbookCompletionRate | `playbookCompleted / playbookStarted` (`playbookStarted` = step-1 acknowledgements) |
| progressionRate | `dealsProgressed / leadsCaptured` |
| closeRate | `dealsClosed / leadsCaptured` |

Missing inputs → **`undefined`** (shown as “—”), **not** zero.

## Score (0–100)

Weighted average of whichever rates exist:

- Playbook completion: **35%** of its component max  
- Progression: **35%**  
- Capture: **15%**  
- Close: **15%**, only when `sampleSize ≥ 15`; otherwise excluded from weights  

Then multiplied by:

- **Data completeness:** high `1.0`, medium `0.88`, low `0.72`
- **Sample tier:** ≥40 → `1.0`, ≥25 → `0.92`, ≥12 → `0.82`, else `0.68`

Confidence:

- **high:** sample ≥ 40 **and** completeness **high**
- **medium:** sample ≥ 18 **and** completeness not low
- else **low**

## Low confidence interpretation

Scores are **relative** summaries of logged activity. Low confidence means **rank order may reorder** if you add attribution or widen the window — not “the city failed.”

## Insight rules

Maximum **five** bullets. Examples reference **logged** dominance or thin samples; they **never** imply geography caused CRM outcomes.

## Advisory-only

Not a leaderboard for brokers or sellers. Admin / operator intelligence only — **no causal proof**.
