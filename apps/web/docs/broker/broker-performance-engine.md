# Broker performance engine

Deterministic execution scoring for brokers — **internal coaching + routing signals**. Not payment logic, not verified sales outcomes, and **not** a public leaderboard for clients.

## What is measured

Data comes from **assigned CRM leads** (`introducedByBrokerId` / `lastFollowUpByBrokerId`), same window as Broker Closing V1 stage derivation:

| Signal | Source |
|--------|--------|
| Assigned leads | Row count (capped query) |
| Contacted / responded / meetings | Derived closing stage + pipeline |
| Won / lost | Terminal stages |
| Follow-ups due | `contacted`, no responded signal, idle ≥ 48h |
| Follow-ups logged | `lastFollowUpAt` present |
| Response delay | Paid unlock → `firstContactAt` pairs only |

Optional **paid lead-unlock count** remains in the **legacy** summary path (`buildBrokerPerformanceSummary`) for marketplace-style retention — the **engine** headline scores emphasize execution on assigned leads.

## How scores are built (0–100)

All bounded; **no divide-by-zero** — denominators guarded.

- **activityScore** — blend of contact coverage on assigned leads, unlock→contact speed (when pairs exist), light volume curve (saturates so extreme volume does not dominate).
- **conversionScore** — contacted→responded progression, responded→meetings, win rate when ≥3 decided deals else pipeline-depth proxy.
- **disciplineScore** — ratio of logged follow-ups (`lastFollowUpAt`) vs overdue heuristic bucket (due + completed style denominator).

**overallScore** = `0.28×activity + 0.38×conversion + 0.34×discipline`, then blended toward neutral **50** when confidence is low (see below).

## Sparse data rules

- **confidenceLevel**: `insufficient` (&lt;5 assigned leads), `low` (&lt;12), `medium` (&lt;25), `high` (≥25).
- Blending weight pulls sub-scores toward **50** when samples are thin — **penalty is implicit uncertainty**, not fake precision.
- **executionBand** `insufficient_data` when confidence is `insufficient` — overall score is still shown (conservative blend) but tier is explicit.
- Other bands from overall (when not insufficient): **elite** ≥88, **strong** ≥74, **healthy** ≥52, else **weak**.

## Leaderboard (admin)

- **Internal only** — route: `/admin/broker-execution-performance`, API: `GET /api/admin/broker-execution-performance`.
- Sort: brokers with **sufficient data first**, then **overallScore** descending, `brokerId` tie-break.
- **“Weakest”** slice is the **lowest scores among those with sufficient data** — for **coaching priority**, not shaming labels.
- **Insufficient sample** listed separately — “needs more leads before fair comparison.”

## What it does **not** mean

- Not proof of legal/compliance quality.
- Not customer-facing ranking.
- Not tied to payouts (incentive flags are **structure only**).

## Broker personal panel

Brokers see **only their own** snapshot on the dashboard (`BrokerPerformancePanel`): tier, three pillar scores, one strength, one constructive focus. No peer comparison in that card.

## Monitoring

In-process logs and counters under **`[broker:performance]`**: `engine_snapshot`, `leaderboard`, `insights`, plus legacy `summary`. Never throws.

## Feature flag

`FEATURE_BROKER_PERFORMANCE_V1` gates broker API and admin leaderboard.
