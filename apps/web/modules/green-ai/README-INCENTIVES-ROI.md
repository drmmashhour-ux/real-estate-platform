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

## Final compliance checklist (engineering)

- **Closed** programs (e.g. Chauffez vert stream modeled as closed after 2026-03-31) must not appear as current incentives unless `historyMode: true` on the incentive estimator / API body.
- **Costs** are always internal bands — never presented as quotes or appraisals.
- **Incentive totals** are `null` whenever any matched program has unmodeled amounts (informational-only rows) so we do not imply a stacked dollar figure.
- **ROI** outputs are narrative-first; no guaranteed resale percentage.
- **Pricing boost** is internal-only; do not use multipliers as public list-price advice.
- All surfaces must show **`QUEBEC_ESG_INCENTIVES_UI_DISCLAIMER`** (Québec-inspired + verify with official programs).
