# Capital allocation engine (internal)

Advisory-only prioritization for **where operators might focus time, execution intensity, and future ad/ops budget**. It does **not** move money, change Stripe, trigger checkout, or automate spending.

## How allocation is computed

1. **Signals** — `collectCapitalAllocationSignals(windowDays)` aggregates existing modules only (city comparison, execution summaries, weekly review, market expansion, scale system gaps, broker competition). Each upstream module keeps its own feature flags. Missing aggregates stay **undefined** upstream; we do **not** substitute zeros for missing measurements.
2. **Normalization** — Per-city rows combine comparison scores, optional expansion candidate fields (readiness, demand/supply proxies), and derived hints (weak conversion vs bundle median captures, thin supply vs demand proxy). Cities are sorted by name for deterministic ordering.
3. **Buckets** — `classifyCityBucket` applies ordered, deterministic rules (hold on thin data first, then expansion-ready, scale winners, conversion fix, broker supply). A separate rule can add **`system:broker_supply`** when broker competition rows are mostly insufficient data or the broker scale gap trend deteriorates.
4. **Priority score** — `computeAllocationPriority` blends execution strength (32%), growth potential (32%), leads scale gap (16%), competition pressure (16% when present), reweighted by how many channels are defined, then multiplied by a conservative **data tier factor** (high 1.0, medium 0.88, low 0.7). Additional **service-level warnings** fire when performance score and execution blend disagree or when expansion score and execution diverge.
5. **Ranking** — Candidates sort by descending score, then target string. Duplicate `(bucket,target)` pairs keep the higher score. The top **six** rows receive **allocation share** = `priorityScore / sum(priorityScore)` within that set (relative, not dollars).
6. **Insights** — Up to five short sentences with explicit uncertainty language; no ROI or “guaranteed growth” phrasing.

## Signals used

| Layer | Use in engine |
|--------|----------------|
| Fast Deal city comparison | Performance score, rates blend, sample tier, conversion hint |
| Market expansion | Growth potential, readiness, confidence, demand/supply, similarity, competition proxy |
| Weekly review | Supporting copy when a city matches top/weakest bundle callouts |
| Scale system | Normalized leads gap vs `buildScalePlan` target; broker `gapChange` for system broker rule |
| Broker competition | Insufficient-data ratio; optional competition pressure when city-level proxy missing |

## Limitations

- Correlational window metrics — not causal proof of revenue or ROI.
- Sparse brokers or cities inflate “insufficient data” bands; **low confidence** should dominate decisions.
- Flags that disable upstream modules reduce available channels; scores are **discounted**, not guessed.

## Operator use

Use the plan to **sequence manual work** and documentation — e.g., standups, budget *proposals*, and experimentation backlogs. Any spend still requires normal approval workflows. Treat **warnings** and **confidence** as mandatory reading; ignore share percentages when confidence is low.

## Safety

- No automated budget execution.
- No ROI promises; optional share is relative rank only.
- Always show confidence and warnings in the API and UI.
