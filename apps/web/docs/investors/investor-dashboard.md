# Investor dashboard (auto-generated)

Internal-only bundle that surfaces **real** CRM + Growth Machine telemetry into a structured investor-facing narrative — **no fabricated KPIs**, **no guarantees**, **not investment advice**.

## How metrics are built

`gatherInvestorDashboardSignals()` (`investor-metrics.service.ts`) pulls:

| Source | Metrics / signals |
|--------|-------------------|
| CRM (`Lead`) | New leads in window, qualified-or-better share, closed-won counts (won rows filtered by `updatedAt` in window) |
| Revenue forecast engine | Illustrative CAD band **only when** `buildRevenueForecast` has sufficient data — otherwise omitted + logged gap |
| Growth execution results | Sparse telemetry warnings; broker-row uniformity |
| Scale system results | Lead delta vs prior window + outcome band |
| Fast Deal city comparison | Top/weakest city + insight lines when comparison flag + cities enabled |

Each `InvestorMetric` includes a **confidence** tier based on event volume heuristics (e.g. lead counts). **Omit** or mark **low** when the underlying query is thin.

## How narrative is generated

`buildInvestorNarrative()` uses **fixed template branches** on `InvestorNarrativeInput` — no LLM, no randomness, no free-form numbers. Headline selection:

1. If `sparseBundle` → *"Early signals with limited logging depth — emphasize ranges, not headlines"*
2. Else if leads up, qualified share ≥ 0.25 → *"Lead flow improving with observable pipeline depth"*
3. Default → *"Measured operating activity with mixed confidence layers"*

Summary lines concatenate only **input numbers** (leads, won, optional revenue center).

## Limitations

- **Not** GAAP, **not** cash, **not** contracted ARR.
- City scores are **internal heuristics** from Fast Deal — not market share.
- **Won** counts use **update time** in the window; new leads and won may not align in short windows.
- When `revenue-forecast` returns `insufficientData`, the dashboard **does not** show a central revenue figure in metrics (narrative states withholding).

## How to present to investors

- Lead with **ranges and confidence**, not point estimates.
- Disclose **data gaps** from `meta.missingDataAreas`.
- Keep the static `InvestorPitchPanel` for designed story; use this dashboard for **ops refresh** only.

## Monitoring

Log prefix: **`[investor-dashboard]`** (builds + missing-data tags).

## Feature flags

- `FEATURE_INVESTOR_DASHBOARD_V1` — API
- `FEATURE_INVESTOR_DASHBOARD_PANEL_V1` — Growth Machine panel (both required for UI)

Default: **off**.
