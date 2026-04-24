# Québec / Canada green incentives & ROI helpers

Internal-only estimation layers for broker tools and listing metadata. **Not financial, legal, or program advice.**

## Catalog source policy

- `quebec-esg-incentives.catalog.ts` is **versioned** and includes `lastVerifiedAt` per entry and for the module.
- Amounts are included **only** when a clear published structure exists; otherwise `amountType: informational` and amounts stay `null`.
- `sourceUrlKey` maps to `SOURCE_URLS` — refresh URLs and amounts when governments update programs.
- **Re-verify** the catalog on a regular cadence (e.g. quarterly) against official Québec and Government of Canada pages.

## Incentive estimation rules

- Estimates use **only** the static catalog (`estimateQuebecEsgIncentives`).
- **Closed** programs are omitted from “current” planning unless `historyMode: true`.
- Stacking is **conservative**: each catalog program attaches at most once per economics run.
- Outputs must be labeled **estimated**; eligibility is **never** guaranteed in copy.

## Cost estimation assumptions

- `quebec-esg-cost.service.ts` uses **deterministic internal CAD bands** by retrofit category (attic, walls, windows, heat pump, ventilation, solar, green roof).
- Bands are **not** scraped market prices and **not** contractor quotes.
- Missing floor area widens ranges and drops confidence to **low**.

## ROI / resale narrative rules

- `quebec-esg-roi.service.ts` is **scenario-based** (conservative / neutral / optimistic).
- **No** unsupported percentage return promises.
- With list price, narratives may discuss **marketability** and **buyer appeal**, not guaranteed price lifts.

## Pricing boost purpose

- `quebec-esg-pricing-boost.service.ts` emits an **internal** signal for ranking/discovery tuning.
- **Do not** surface raw multipliers as public pricing claims.

## Required disclaimers

- UI and APIs must show that incentives and eligibility must be verified with **official programs**.
- Use `QUEBEC_ESG_INCENTIVES_UI_DISCLAIMER` / `QUEBEC_ESG_ECONOMICS_API_DISCLAIMERS` for consistency.

## Periodic refresh

- When programs change (rates, closures, new intake), update the catalog, bump `QUEBEC_ESG_INCENTIVES_CATALOG_VERSION`, and adjust tests if behavior changes.
