# Revenue Dashboard (V1 — operator action layer)

## Purpose

Read-only operator view of **where money shows up** (`revenue_events`) and **funnel health** (leads, brokers, BNHub booking signals). This phase **does not** execute payments, change Stripe, or alter pricing.

The UI now surfaces **sparse-data messaging**, **daily goal vs today**, **rules-based operator recommendations**, **broker / BNHub tie-ins**, **prioritized alerts**, and a **daily checklist** — without replacing the core summary pipeline (`buildRevenueDashboardSummary`).

## Required flags

`GET /api/growth/revenue` requires Growth Machine auth and **at least one** of:

| Env | Role |
|-----|------|
| `FEATURE_REVENUE_DASHBOARD_V1` | Primary dashboard aggregates (`modules/revenue/revenue-dashboard.service.ts`) |
| `FEATURE_GROWTH_REVENUE_PANEL_V1` | Growth Machine revenue strip + same API when dashboard flag is off |

If **both** are off, the API returns **403** with JSON:

- `code`: `"REVENUE_FLAGS_DISABLED"`
- `requiredFlags`: `{ env, hint }[]`

The operator panel explains this as **access gated**, not a generic failure.

### Daily target env

| Env | Meaning |
|-----|---------|
| `REVENUE_DASHBOARD_DAILY_TARGET_DEFAULT` | CAD — default daily goal for the target strip (default **750** if unset). Advisory only; not billing. |

## Metrics displayed

| Area | Source |
|------|--------|
| Revenue today / week / month | Sum of positive `RevenueEvent.amount` in UTC windows |
| Revenue by source (7d) | `event_type` → `lead_unlock`, `booking_fee`, `boost`, `subscription`, `other` |
| Source drill-down | Per-source **amount**, **event count**, **average** (7d, positive amounts only) |
| Lead unlock rate | `leadsUnlocked / max(1, leadsViewed)` |
| Brokers | Active brokers; **brokers generating revenue** (30d payer attribution); **unlocked leads (7d)**; avg revenue / paying broker (7d); avg revenue / **active** broker (7d) |
| BNHub | Booking **fee** revenue (7d), booking fee **event** count, avg per fee event; funnel starts/completions + completion rate |
| Daily target strip | Today revenue vs `REVENUE_DASHBOARD_DAILY_TARGET_DEFAULT`, **% to goal** |
| Alerts | Deterministic rules in `revenue-dashboard-alerts.service.ts`, **sorted by priority** — first alert is labeled **Primary today** |
| Operator actions | Rules in `revenue-dashboard-operator-guidance.ts` |
| Checklist | Today’s focus + **top 3 actions** (alerts + recommendations + deterministic fillers) |

## Sparse-data expectations

Zeros are **not always “healthy”**:

- **No money + no positive events in 7d** → *“No revenue events yet”* (and related copy).
- **Low lead/funnel + few events** → *“Lead and conversion signals are still sparse.”*
- **Booking starts but no `booking_fee` revenue** → *“Booking revenue will appear once booking/payment events are recorded.”*
- **KPI subtext** when views+unlocks are tiny: unlock rate line notes **sparse conversion** so `0%` is not read as a closed funnel.

## Operator workflow (daily)

1. **Open** Growth revenue panel (auth as Growth Machine operator).
2. **If 403** — turn on `FEATURE_REVENUE_DASHBOARD_V1` or `FEATURE_GROWTH_REVENUE_PANEL_V1` in the environment; refresh.
3. **Read the target strip** — today vs goal; if % is low, focus on the **Primary today** alert and **Top 3 actions**.
4. **Scan source rows** — which stream is missing (leads vs booking fee vs boost).
5. **Brokers + BNHub** — payers vs actives; booking fee events vs funnel.
6. **Use notes** for data-quality caveats (`lead_viewed` vs enforcement, etc.).

## Alert logic & prioritization

`detectRevenueAlerts()` emits bounded alerts each with a **priorityScore** (higher = tackle first). Examples: lead views without unlocks (high), bookings starting but not completing (high), no revenue today (warning-tier but ordered after sharper funnel issues).

## Interpretation: zero states

| Signal | Interpretation |
|--------|----------------|
| Revenue today `$0` | Often real; paired with sparse banner if **no events** logged. |
| Unlock rate `0%` | Check denominator — if `views` tiny, prefer sparse copy over panic. |
| Booking fee `$0` but starts `> 0` | Payments not hitting `booking_fee` RevenueEvents yet. |

## Safety guarantees

- No Stripe webhook, checkout, lead unlock, or booking route changes from this module.
- Missing tables or optional queries still fall back to zeros and dashboard **notes**.

## Validation commands

```bash
cd apps/web && npx vitest run \
  modules/revenue/__tests__/revenue-dashboard.service.test.ts \
  modules/revenue/__tests__/revenue-alerts.service.test.ts \
  modules/revenue/__tests__/revenue-dashboard-response.test.ts \
  modules/revenue/__tests__/revenue-dashboard-operator-guidance.test.ts \
  modules/revenue/__tests__/revenue-dashboard-target.test.ts
```

## Module map

| File | Role |
|------|------|
| `modules/revenue/revenue-dashboard.types.ts` | Summary, breakdown, alerts, checklist types |
| `modules/revenue/revenue-dashboard.service.ts` | `buildRevenueDashboardSummary()` |
| `modules/revenue/revenue-dashboard-operator-guidance.ts` | Sparse copy, recommendations, checklist |
| `modules/revenue/revenue-dashboard-target.ts` | Daily target default + progress |
| `modules/revenue/revenue-dashboard-response.ts` | Parses `/api/growth/revenue` JSON for UI + tests |
| `modules/revenue/revenue-dashboard-alerts.service.ts` | `detectRevenueAlerts()` |
| `app/api/growth/revenue/route.ts` | GET `{ summary }` · 403 flags contract |
| `components/revenue/RevenueOverviewPanel.tsx` | Operator UI |

## Risks / limits

- Amounts reflect `RevenueEvent` + best-effort funnel tables; not GAAP / Stripe reconciliation.
- Lead “views” may use enforcement counters when durable `lead_viewed` rows are sparse (surfaced in **notes**).
