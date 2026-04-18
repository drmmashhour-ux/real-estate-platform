# Revenue Enforcement Layer (V1)

Additive instrumentation and optional soft gating around high-value actions. **Does not modify Stripe webhooks** or booking payment logic.

## Flags

| Env | Default | Purpose |
|-----|---------|---------|
| `FEATURE_REVENUE_ENFORCEMENT_V1` | off | Enable `[revenue]` structured logs, in-memory counters (with dashboard flag), guard evaluation |
| `FEATURE_REVENUE_DASHBOARD_V1` | off | Growth Machine panel + `GET /api/revenue/overview` |
| `REVENUE_ENFORCEMENT_BLOCK_CHECKOUT` | off | When enforcement is on, soft-block **lead unlock** checkout if user has no active subscription and is not bypassed |
| `REVENUE_ENFORCEMENT_DEV_BYPASS_USER_IDS` | empty | Comma-separated user ids that always pass the guard |

## What is tracked (log + optional counters)

- `lead_viewed` — broker/admin `GET /api/leads/[id]`
- `contact_revealed` — same route when `contactUnlockedAt` is set
- `lead_unlocked` — lead unlock Stripe **checkout session created** (`/api/leads/[id]/unlock-checkout`)
- `booking_started` — BNHub booking checkout session path in `POST /api/stripe/checkout` (alongside existing analytics)
- `premium_insight_viewed` — `isLecipmAiInsightsPremiumUser()` when enforcement or dashboard flag is on (monetization enabled)
- Client `POST /api/revenue/events` — authenticated fan-in (e.g. CTA intents)

Counters are **in-process** (serverless: per instance, not durable).

## What is guarded

- `canAccessRevenueFeature` — subscription stub (`subscriptions` rows with status `trialing` or `active`) or bypass list.
- Lead unlock checkout returns JSON `{ softBlock: true, message, cta, reason }` only when enforcement is on **and** `REVENUE_ENFORCEMENT_BLOCK_CHECKOUT=1`.

## What is not enforced yet

- Webhook-side confirmation of paid lead unlock (`lead_unlocked` here means checkout session created, not settled funds).
- `booking_completed` counter (no webhook changes in V1; stays at 0 unless you add a separate beacon later).
- Hard blocks on BNHub booking or global paywalls.

## Rollout

1. Enable dashboard flag only → observe `/api/revenue/overview` + logs.
2. Enable enforcement flag → soft allow by default (`reason: not_paid` but checkout still works).
3. Enable `REVENUE_ENFORCEMENT_BLOCK_CHECKOUT` for strict soft-block on lead unlock only.

## Related files

- `modules/revenue/revenue-events.service.ts`
- `modules/revenue/revenue-guard.service.ts`
- `modules/revenue/revenue-monitoring.service.ts`
- `modules/revenue/revenue-alerts.service.ts`
- `components/revenue/RevenueUnlockCTA.tsx`
- `components/revenue/RevenueOverviewPanel.tsx`
