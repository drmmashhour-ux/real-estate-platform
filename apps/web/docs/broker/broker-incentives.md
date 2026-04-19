# Broker incentives (recognition layer)

Positive reinforcement tied to **measurable CRM behavior**. This is **not** compensation, commissions, contests with prizes, or automated payouts.

## What incentives are

- **Badges** — short labels when deterministic thresholds are met (response speed, follow-ups logged, pipeline depth, wins in CRM).
- **Streaks** — consecutive **UTC calendar days** with real touches: activity (contact timestamps), follow-up logs (`lastFollowUpAt`), fast unlock→contact (≤24h) on `firstContactAt` day.
- **Milestones** — first outreach, reply signal, meeting step, recorded win, volume thresholds — `achievedAt` when CRM dates exist.

Summaries combine these with **highlights** (what is going well) and **next targets** (constructive next actions). No negative badges or penalties.

## What they are NOT

- Not Stripe, payouts, bonuses, or referral fees.
- Not guarantees of income or closing.
- Not peer shaming rankings for brokers.

## Feature flag

| Variable | Effect |
|---------|--------|
| `FEATURE_BROKER_INCENTIVES_V1=1` | Broker dashboard recognition panel; `GET /api/broker/incentives`; admin observability |

Depends on CRM data existing (same lead assignment scope as performance engine).

## APIs

| Route | Audience | Purpose |
|-------|----------|---------|
| `GET /api/broker/incentives` | Broker session | Personal summary |
| `GET /api/admin/broker-incentives-overview` | Admin / Accountant | Coaching visibility only |

Admin page: `/admin/broker-incentives`.

## Monitoring

Structured logs `[broker:incentives]` via `broker-incentives-monitoring.service.ts` — counts summaries, badges in batch, streak rows, milestones achieved tally. Never throws upstream.

## How brokers should use it

- Treat as **feedback**, not judgment.
- Use streaks as a gentle rhythm check — UTC day boundaries mean evening work may fall on “tomorrow.”
- Prefer **next targets** when choosing the day’s outreach block.
- Low volume: milestones and badges still unlock honestly; highlights explain when the sample is still small.

## Sparse / low-volume fairness

Warm-start style badges exist for early brokers; confidence messaging mirrors the performance engine (recognition grows with assigned leads).
