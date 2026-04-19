# Market expansion engine

Internal advisory ranking for **which city might deserve focus next**. Uses Fast Deal comparison, per-city signals, similarity to the reference city, and conservative scoring.

## What feeds the model

- **Performance:** Same Fast Deal aggregates as city comparison (`buildCityComparison` pipeline).
- **Demand proxy:** logged `leadsCaptured` volume for the window.
- **Supply proxy:** count of **`ACTIVE` + `APPROVED`** `FsboListing` rows grouped by normalized city label (approximate string match across spelling variants).
- **Competition proxy:** broker sourcing density (`session_started` + `broker_found_manual`).
- **Similarity:** deterministic distance on whichever **pairs** of derived ratios exist (`captureRate`, playbook completion, progression, demand/supply ratio) vs the reference city.

Nothing is interpolated or guessed when a numerator/denominator is missing.

## Scoring formula (0–100)

Let `similarityScore ∈ [0,1]` from the similarity engine. Demand normalized by `demand / max(demand among candidate cities)`. Gap term uses `min(1, cityDemandSupply / referenceDemandSupply)` when both ratios exist. Inverse competition uses `1 − min(1, comp/maxComp)`.

Weighted blend (points renormalized if some channels missing):

| Channel | Weight |
|---------|--------|
| Similarity | 38 |
| Demand | 26 |
| Demand/supply gap vs reference | 18 |
| Inverse competition | 12 |

Then multiply by **data completeness** factor (high 1.0, medium 0.88, low 0.72) and **sample penalty** on Fast Deal sample size (n&lt;12 heavy discount; n≥40 full).

## Readiness & confidence

- **Readiness:** high if score ≥72, n≥25, completeness not low; medium if score ≥48 and n≥15; else low.
- **Confidence:** high if n≥35 and completeness high; medium if n≥18 and completeness not low; else low.

## Limitations

- Not causal — similar logged patterns do not guarantee adoption success.
- Supply counts depend on FSBO inventory spelling — sparse labels reduce reliability (warnings emitted).
- No outreach, Stripe, booking, or CRM mutations are triggered.

## Flags

- `FEATURE_MARKET_EXPANSION_V1` — API / engine.
- `FEATURE_MARKET_EXPANSION_PANEL_V1` — Growth Machine panel (requires `FEATURE_FAST_DEAL_CITY_COMPARISON_V1` for data).

Default: **off**.
