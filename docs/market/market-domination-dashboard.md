# Market Domination Dashboard (LECIPM)

## Purpose

Executive and operator dashboard for **where LECIPM is strong**, **where gaps exist**, **which territories are expansion-ready**, **hub penetration by territory**, **competitor pressure (manual v1)**, and **prioritized moves**. Outputs are **explainable** and deliberately **avoid false precision**: metrics are normalized proxies until warehouse-backed facts are wired.

## Territory model

- **Scope**: `CITY` | `DISTRICT` | `NEIGHBORHOOD` | `REGION`.
- Each **Territory** has `TerritoryMetrics`: listings, brokers, BNHub supply, investor activity, residence services supply, buyer/renter demand, leads, bookings, revenue (cents), conversion rate, growth rate, active users, supply/demand ratio.

Seed data lives in `defaultSeedTerritories()`; overrides can be persisted client-side (`localStorage`) for demos.

## Domination score

Weighted blend (`DEFAULT_DOMINATION_WEIGHTS` in `market-domination.config.ts`) of:

- Average **hub penetration** scores (0–1 proxies per hub).
- **Revenue / booking** proxies.
- **Supply coverage** (`supplyDemandRatio`).
- **Demand capture** (buyer + renter normalized).
- **Repeat usage** (`activeUsers`).
- **Growth momentum** (`growthRate`).

Trend is coarse: **up** / **flat** / **down** from growth-rate thresholds.

## Readiness model

`scoreExpansionReadiness` combines supply, demand signals, operational coverage, revenue signals, conversion potential, and local traction using `DEFAULT_READINESS_WEIGHTS`. Bands:

`NOT_READY` → `EMERGING` → `READY` → `PRIORITY`.

## Gap analysis

`analyzeMarketGaps` emits typed **GapType** rows (demand/supply imbalance, conversion weakness, broker bench, BNHub inventory, investor vs inventory, residence demand vs supply). Severity is **watch** / **important** / **critical** based on thresholds.

## Competitor model (v1)

Manual rows via `upsertCompetitor` / browser storage. **Pressure** is a simple function of logged competitor strength and count — useful for ops triage, not competitive intelligence precision.

## Prioritization

`prioritizeMarkets` ranks territories using `DEFAULT_PRIORITIZATION_WEIGHTS`: revenue upside, speed to win, demand intensity, strategic fit (readiness), operational feasibility, competitor weakness.

## Explainability

`explainTerritoryScore` documents drivers, weakeners, **why act now**, and **leading hub**. Recommendations include narrative explanation strings; confidence is qualitative (0–1).

## Mobile APIs

- `GET /api/mobile/admin/market-domination/summary`
- `GET /api/mobile/admin/market-domination/territories`
- `GET /api/mobile/admin/market-domination/territory/[id]`

Admin authentication required (`PlatformRole.ADMIN`).

## Manager workflow

1. Open **Market domination** from admin (also linked from Growth Brain).
2. Scan **alerts** and **gaps** for urgency.
3. Use **hub penetration grid** to see which product line to push per city.
4. Cross-check **readiness** before scaling spend.
5. Log competitors in CRM or future admin form; refresh view to update pressure.
6. Drill into a **territory** for explainability and illustrative trend history.
7. Feed back real listing/CRM data over time to replace seed metrics.

## Tests

`apps/web/modules/market-domination/__tests__/market-domination.test.ts` covers penetration bands, gaps, readiness, competitor pressure, prioritization, domination scoring, and explainability.
