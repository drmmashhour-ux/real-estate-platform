# Global dashboard

## Scope

Admin-only **read-only** aggregates comparing regions (listings proxies, Syria aggregates, jurisdiction packs).

## APIs

- `GET /api/admin/global-dashboard` — investor-style bundle (`buildGlobalInvestorDashboard`).
- Query `?slice=comparison|risk|growth|trust` for partial payloads.

## UI

Route: `/[locale]/[country]/admin/global-marketplace` — composes hero, comparison table, risk/trust/growth cards, automation posture, domination summary.

## Flags

`FEATURE_GLOBAL_DASHBOARD_V1`, `FEATURE_REGION_ADAPTERS_V1`, `FEATURE_GLOBAL_MULTI_REGION_V1`.
