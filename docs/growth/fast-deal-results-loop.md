# Fast Deal results loop

Internal measurement and attribution for the **Fast Deal Engine** (broker sourcing panel, lead capture preview, 48h closing playbook). **Default off** via feature flags.

## What is measured

- **Broker sourcing (manual):** operator clicks “Log session”, “Copy” on search queries → events tagged with `platform`, `city`, `query` (copy only). No scraping, no bots.
- **Landing (growth preview):** once per browser session per market label, preview shown; first focus inside the form logs “form started”; successful `POST /api/growth/early-leads` with optional `growthDashMarket` logs a submission for Fast Deal aggregates only when `FEATURE_FAST_DEAL_RESULTS_V1` is on.
- **48h playbook:** explicit buttons “Log step acknowledged / completed” and “Log full playbook session completed” — operator-confirmed only.

Downstream **outcomes** (`fast_deal_outcomes`) can be appended via `POST /api/admin/growth/fast-deal/log` with `kind: "outcome"` (e.g. `lead_captured`, `deal_progressed`). These are tags for learning, not proof of causality.

## What is not measured

- No automatic outreach or message sends.
- No Stripe, checkout, booking, or payment instrumentation in this loop.
- Public early-lead posts **without** `growthDashMarket` do **not** write Fast Deal landing events (avoids polluting operators’ metrics with unrelated traffic).

## Operator workflow

1. Turn on `FEATURE_FAST_DEAL_RESULTS_V1` (and optionally `FEATURE_FAST_DEAL_RESULTS_PANEL_V1` for the dashboard card).
2. Use the Growth Machine Fast Deal panels as today; optionally log sourcing sessions and playbook steps when you actually did the work.
3. For CRM-tagged outcomes, POST outcome rows from internal tools or scripts (admin API), or extend the product later — this pass only adds storage + aggregation + UI.

## Why this is not “automated outreach”

Logging is **explicit** (button clicks) or **bounded** (one preview per market/session, form focus once, optional dashboard-only submit attribution). Nothing sends email, SMS, or DMs from this layer.

## APIs

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/api/admin/growth/fast-deal/summary` | Admin | Deterministic `FastDealSummary` |
| POST | `/api/admin/growth/fast-deal/log` | Admin | `kind: source` or `kind: outcome` |

Monitor prefix in server logs: `[fast-deal]`.
