# Wealth engine (educational)

Internal **scenario lab** for thinking about multi-decade capital allocation, preservation, and reinvestment **without** providing investment advice or promising returns.

## What it is

- **Configurable** bucket weights and risk bands.
- **Illustrative** comparisons between current weights and default or custom targets.
- **Heuristic** reinvestment ordering (reserve → operating → diversification).
- **Qualitative** preservation flags (concentration, runway labels, dependency hints).
- **Narrative** scenarios (conservative / balanced / aggressive) — assumptions and discussion prompts only.

## What it is not

- Not financial, tax, or legal advice.
- No forecasts, CAGR, Monte Carlo, or probability of success.
- No security or product recommendations.

## Bucket logic

Strategic sleeves (all optional to tune; labels are generic):

| Key | Intent |
|-----|--------|
| `CASH_RESERVE` | Liquidity and runway (educational framing). |
| `OPERATING_VENTURES` | Active businesses / operating capital. |
| `PRIVATE_INVESTMENTS` | Private credit, equity, funds — user-defined. |
| `REAL_ESTATE` | Real property and related structures. |
| `PUBLIC_MARKETS` | Listed / liquid diversified exposure (conceptual). |
| `OPPORTUNISTIC_CAPITAL` | Discretionary / event-driven capacity (conceptual). |

Default **target** mixes by risk band live in `modules/wealth-engine/allocation.service.ts` (`RISK_BAND_DEFAULT_TARGETS`). **Custom** mode uses the profile’s own `targetWeight` values per bucket (normalized to sum to 1).

## Preservation rules (qualitative)

The preservation layer (`preservation.service.ts`) combines:

- Self-reported **liquidity runway** (months) and **liquid fraction**.
- **Overconcentration** flags when a sleeve is far above an illustrative target or a single bucket is very large.
- Optional **primary venture weight** and **region label** to surface *dependency* themes in copy — not a risk model.

Downside “sensitivity” is a **label** tied to the selected risk band, not a stress test.

## Reinvestment rules

`reinvestment.service.ts` applies a **planner’s ordering** only:

1. Close the gap on **cash reserve** (illustrative).
2. Address **operating ventures** underweight vs target.
3. Flow toward **diversification** buckets that are underweight.

`allocateNewLiquidity` splits a hypothetical cash amount using the same priority pattern. Amounts are illustrative; tax and legal constraints are out of scope.

## Scenario assumptions

`scenario.service.ts` returns three parallel **narratives**:

- **Conservative** — liquidity-first discussion, smaller opportunistic emphasis in text.
- **Balanced** — even framing across sleeves vs your configured targets.
- **Aggressive** — growth and idiosyncratic risk themes with explicit illiquidity caveats in text.

Each scenario includes **assumptions**, **allocation discussion themes** per bucket, and **resilience notes**. There are **no** numeric return paths.

## Dashboard

- Route: `/dashboard/wealth-engine` (requires login).
- Client UI: `apps/web/app/dashboard/wealth-engine/`.

## Disclaimer

This tool is for **education and internal planning conversations** only. Users must consult qualified professionals before making financial decisions. Past scenarios do not imply future results.
