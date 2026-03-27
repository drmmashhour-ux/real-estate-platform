# Mortgage expert monetization

Automated billing for **MORTGAGE_EXPERT** users: Stripe subscriptions (Basic / Pro / Premium), pay-per-lead credits, commission tracking (default 30%), Connect payouts, and dashboards.

## Environment

See `apps/web/.env.example`:

- `STRIPE_PRICE_MORTGAGE_PRO_MONTHLY`, `STRIPE_PRICE_MORTGAGE_PREMIUM_MONTHLY` (and optional Basic)
- `STRIPE_PRICE_MORTGAGE_LEAD_CREDIT_UNIT` (one Stripe **unit** = one credit; Checkout quantity = pack size)
- `STRIPE_ENABLE_MORTGAGE_EXPERT_TRANSFERS=true` — optional; transfers expert share on deal close to the expert’s Connect account (`User.stripeAccountId`)

## API routes

| Route | Purpose |
|-------|--------|
| `POST /api/stripe/subscribe` | Expert subscription Checkout (Pro/Premium) |
| `POST /api/stripe/mortgage-expert/credits` | One-time credit pack Checkout |
| `GET /api/mortgage/expert/billing` | Dashboard JSON |
| `GET /api/mortgage/expert/billing/invoices/[id]` | Printable invoice (HTML download) |
| `POST /api/stripe/connect/onboard` | Connect onboarding (hosts **or** mortgage experts) |
| `GET /api/admin/mortgage-monetization` | Admin revenue rollup |

## Webhooks

`POST /api/stripe/webhook` must receive (in addition to existing events):

- `checkout.session.completed` — credits + first subscription payment (metadata `paymentType`: `mortgage_expert_subscription` | `mortgage_expert_credits`)
- `customer.subscription.updated`
- `customer.subscription.deleted`

Signature verification is mandatory (`STRIPE_WEBHOOK_SECRET`).

## Database

Migration: `prisma/migrations/20260401120000_mortgage_expert_monetization_stripe/migration.sql`

Models: `ExpertBilling`, `ExpertInvoice`, `ExpertPayoutRecord`, `ExpertSubscription.maxLeadsPerMonth`.

## Plans & limits

Configured in `lib/mortgage/subscription-plans.ts`: Basic 10 leads/month, Pro 50, Premium unlimited (`-1`) with higher routing priority.

## UI

- Expert: `/dashboard/expert/billing` (black + gold)
- Admin: `/admin/mortgage-monetization`
