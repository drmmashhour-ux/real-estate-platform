# BNHub ranking engine (V1)

Deterministic, explainable ordering for BNHub stays search when `FEATURE_BNHUB_RANKING_V1=1` (requires `FEATURE_BNHUB_V2=1`). Does **not** mutate listings or prices.

## Signals (real data only)

- Conversion: `AiConversionSignal` aggregates (search views, clicks, listing views, booking starts, completions) → CTR, view→start, start→paid.
- Listing quality: photo count, amenities count, description length, verification.
- Freshness: age since `createdAt`.
- Price competitiveness: nightly rate vs median of published peers in the same city (sparse-safe).
- Trust: verification, quality score when present, host performance score when present.
- Featured: small capped boost when listing is in active promoted placements (read-only lookup).

Cold-start: low event volume reduces reliance on conversion sub-scores and increases weight on completeness/freshness (`BNHUB_RANKING_COLD_START_*` in `config/bnhub-ranking-pricing.config.ts`).

## Sort modes

| Client `sort`   | Behaviour                                      |
|-----------------|------------------------------------------------|
| `recommended` / `ai` | Weighted composite score (when AI engine off). |
| `best_value`    | Value index: quality×conversion vs price.      |
| `top_conversion`| Orders by conversion sub-score.                |
| `newest`, `priceAsc`, `priceDesc` | Existing DB ordering (unchanged).      |

Integration: `lib/bnhub/listings.ts` → `applyBnhubStaysRanking` after filters/availability, **before** legacy AI rerank when the AI ranking engine is enabled (BNHub V1 ranking is skipped when the external AI engine handles `recommended`).

## Monitoring

Prefix: `[bnhub:ranking]` — safe `console.info`, never throws.

## Rollout

1. Internal/staging: enable flags, validate ordering on `/bnhub/stays`.
2. Partial: monitor conversion metrics and host feedback.
3. Full: leave `FEATURE_BNHUB_RANKING_V1=1` in production after validation.

## Sparse-data caveats

- Peer median needs several published listings in the city; otherwise price competitiveness is neutral.
- New listings get freshness weight; explanations never claim demand without signals.
