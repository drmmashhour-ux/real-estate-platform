# Fast Deal city comparison (internal)

Operator-facing **decision support** — not a public leaderboard and **not** proof that a geography causes outcomes.

## What is compared

Per city and rolling window (`windowDays`):

- **Activity:** broker sourcing sessions, brokers found, landing captures (when logged with city / market metadata).
- **Execution:** playbook starts, completions, optional average completion time when derivable.
- **Progression:** qualified leads, meetings, deals progressed / closed when outcome rows carry attribution.

Metrics aggregate only from **existing Fast Deal source events and outcomes**. Missing inputs stay **omitted** (UI shows “—”), not fabricated zeros.

## What is not compared

- Payments, Stripe, booking flows — **unchanged** and **not** part of this engine.
- Automated outreach — **not** triggered by this module.
- Causal impact of “being in city X” — **not** claimed; copy and API disclaimer keep this explicit.

## Scoring (0–100)

`computeCityPerformanceScore` combines **available** derived ratios with fixed weight *caps*:

| Signal | Max points in sum | Notes |
|--------|-------------------|--------|
| `playbookCompletionRate` | 35 | Only if numerator/denominator exist |
| `progressionRate` | 35 | `dealsProgressed / leadsCaptured` |
| `captureRate` | 15 | `leadsCaptured / sourcingSessions` |
| `closeRate` | 15 | Included in the weighted sum **only if** `sampleSize ≥ 15` |

**Base:** `sum(weight_i × rate_i) / sum(weight_i used) × 100` (renormalized if some rates are missing).

Then multipliers:

- **Data completeness:** high `×1`, medium `×0.88`, low `×0.72`.
- **Sample size:** `n ≥ 40 → ×1`; `≥ 25 → ×0.92`; `≥ 12 → ×0.82`; below 12 → ×0.68 (+ warning).

Result is rounded to an integer in `[0, 100]`.

**Confidence**

- **high:** `n ≥ 40` and completeness **high**
- **medium:** `n ≥ 18` and completeness not **low**
- else **low**

## Low data behavior

- Any rate with missing or zero denominator → **undefined** (not imputed).
- Thin samples get **score discount** and **warnings**; close rate excluded from weighted sum when sample size is below 15.
- Insights cap at **5** lines and call out thin samples / all-low-confidence windows.

## Insight rules (non-causal)

Insights are generated in `generateCityComparisonInsights`:

- Always lead with a line that rankings are **not** causal proof.
- Optionally mention highest playbook completion among cities with **enough** logs (`sampleSize ≥ 12`).
- Optionally contrast progression ratios between top/bottom cities with a reminder to verify CRM tagging.
- Flag **very small samples** (fewer than 12 attributed events) and **all-low-confidence** windows.

No language implies that moving spend or headcount to a city will mechanically reproduce logged ratios.

## Monitoring

Logs use prefix **`[fast-deal:city]`** (e.g. `comparison_built` with city count and low-confidence count). Handlers **never throw** from monitoring.

## Feature flags

- `FEATURE_FAST_DEAL_CITY_COMPARISON_V1` — engine + admin API.
- `FEATURE_FAST_DEAL_CITY_COMPARISON_PANEL_V1` — Growth dashboard panel (used together with the comparison flag where enabled).

Default: **off**.

## Advisory-only confirmation

This system is **internal**, **advisory**, and **association-only**. Operators must combine it with qualitative judgment, attribution quality checks, and business constraints — never treat a rank as “best city to invest in” without reading warnings and confidence.
