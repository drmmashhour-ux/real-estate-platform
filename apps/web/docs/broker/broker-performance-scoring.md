# Broker performance scoring + marketplace ranking (V1)

Advisory layer on top of existing CRM leads (`introducedByBrokerId` / `lastFollowUpByBrokerId`) and paid `PlatformPayment` rows (`paymentType: lead_unlock`, `status: paid`). **Does not** change Stripe core, lead submission, billing rules, or access control.

## Feature flags

| Variable | Default | Effect |
|----------|---------|--------|
| `FEATURE_BROKER_PERFORMANCE_V1` | off | Broker dashboard panel + `GET /api/broker/performance` return 404. |
| `FEATURE_BROKER_MARKETPLACE_RANKING_V1` | off | Admin ranking panel + `GET /api/admin/broker-performance` return 404. |

## Scoring dimensions (0–100 each)

| Sub-score | Signals (deterministic) |
|-----------|-------------------------|
| Response speed | Hours from `contactUnlockedAt` → `firstContactAt` when both exist; blended toward neutral when few pairs. |
| Contact rate | Share of assigned leads past untouched `new`. |
| Engagement | Mix of DM replied rate, stages at/after responded, average `engagementScore`. |
| Close signals | Win rate when enough closed rows; else pipeline depth proxy. |
| Retention | Count of paid lead-unlock payments (participation signal, not revenue optimization). |

Overall score is a **weighted blend** of the five (see `broker-performance.service.ts`). Small samples are **blended toward 50** to avoid noisy extremes.

## Bands

`classifyBrokerPerformanceBand`: **strong** if score ≥ 75 and at most one weak-signal string; **good** for mid scores or high score with multiple weak data warnings; **watch** / **low** below thresholds. Labels are **not** used to block platform use in V1.

## Marketplace ranking

`buildBrokerMarketplaceRankings` scores each broker and sorts by `rankScore` (overall), tie-break by `brokerId`. **Advisory only** — no auto-routing, no hiding listings or brokers.

## Routing readiness

`GET /api/admin/broker-performance` returns `readiness` from the same ranking pass: cohort size, strong-band count, and whether future experiments might be reasonable — **still no routing**.

## Safety

- No fabricated wins; sparse data explicitly flagged in `weakSignals`.
- Brokers are not denied access based on score in V1.
- Rankings are intended for **internal/admin** use; not public-facing in V1.
