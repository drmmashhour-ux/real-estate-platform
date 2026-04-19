# Growth execution results layer

Internal measurement for **AI-assisted execution**, **broker competition**, and **scale system** surfaces on the Growth Machine. **Read-only aggregates and append-only telemetry** — no automation, no Stripe/payment mutations, no CRM writes from this layer.

## What is measured

### AI-assisted execution

- Append-only rows in `growth_events` (`growth_execution_ai_*`) with `metadata.growthExecution.suggestionId`.
- Tracks **view** (once per suggestion per day via idempotency), **copy**, **local approve (ack)**, **ignore**.
- Rows are aggregated per current suggestion id list from the deterministic suggestion builder — **no LLM**.
- Outcome bands describe **interaction mix**, not business outcomes.

### Broker competition

- Competition profile (tier/score) from existing read-only monetization aggregates.
- **Two adjacent windows** of length `windowDays`: recent vs prior **lead monetization events** (`lead_unlock`, `lead_purchased`) per broker user id.
- `leadActivityDelta` = recent count − prior count; `closeSignalDelta` = coarse ratio delta — **proxies only**.

### Scale system

- **Leads:** count of `Lead` rows created in each window.
- **Brokers:** count of **new** `User` rows with broker role created in each window (acquisition proxy — not active roster).
- **Revenue:** sum of positive `RevenueEvent.amount` (CAD) per window vs internal plan targets from `buildScalePlan()`.

## What is not measured

- No proof that viewing the panels caused downstream change.
- No linkage from a single suggestion to a specific deal close (would require causal design).
- Broker “close” is **not** legal closing rate — only monetization-event density.

## Outcome bands (deterministic)

Defined in `growth-execution-results-bands.ts`:

| Area | Positive | Neutral | Negative | Insufficient |
|------|-----------|---------|----------|--------------|
| AI | Copy or local ack | Ignore-only, or view-only telemetry | *(unused — interactions not scored harmful)* | No telemetry rows in window |
| Broker | Preferred/elite tier and delta ≥ +1 purchases | Weak movement | Delta ≤ −2 purchases | Fewer than 3 monetization events across both windows |
| Scale (leads) | Δ leads ≥ +3 vs prior window | Between | Δ ≤ −3 | Both windows zero leads |
| Scale (revenue) | Δ CAD > +20 | Between | Δ < −20 | Both windows zero revenue |
| Scale (brokers) | New broker signups Δ > 0 | No change | Δ < 0 | Both windows zero |

Bands are **labels for triage**, not judgments of team performance.

## Sparse-data behavior

- AI: fewer than **2** execution telemetry events in-window → summary warning (`AI_TELEMETRY_SPARSE_THRESHOLD`).
- Broker: total monetization events for a broker across both windows **< 3** → `insufficient_data` band + explicit explanation.
- Broker summary: if **every** broker row is insufficient → extra sparse warning.

## Safety boundary

- GET summary and POST telemetry require Growth Machine auth — **no public access**.
- Telemetry POST does not enqueue jobs, send mail, or alter leads/brokers/pricing.
- Copy in UI remains manual; telemetry only records that the operator invoked copy.

## Reading “insufficient data”

Means **no reliable contrast** in the chosen windows — widen `windowDays`, verify revenue events exist for brokers, or enable telemetry (`FEATURE_GROWTH_EXECUTION_RESULTS_V1`) so AI interactions are logged.

## Monitoring

Logs: `[growth:execution-results]` with band histograms per section and sparse flags — handlers never throw.

## Feature flags

- `FEATURE_GROWTH_EXECUTION_RESULTS_V1` — APIs + telemetry acceptance.
- `FEATURE_GROWTH_EXECUTION_RESULTS_PANEL_V1` — dashboard panel (typically both on for operators).

Default: **off**.
