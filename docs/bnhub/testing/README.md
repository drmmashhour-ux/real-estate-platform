# BNHub / LECIPM — testing & validation

Lightweight checks without heavy new frameworks. **Secrets never appear in mobile or committed scripts.**

## Required environment (apps/web)

| Variable | Used for |
|----------|-----------|
| `NEXT_PUBLIC_APP_URL` | Stripe success/cancel URLs |
| `NEXT_PUBLIC_SUPABASE_URL` | Listings / bookings |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only: bookings, webhooks, DB validate |
| `STRIPE_SECRET_KEY` | Checkout + webhooks |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |

Mobile: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` only (no secret keys).

## Commands (from `apps/web`)

| Command | Purpose |
|---------|---------|
| `pnpm run test:bnhub:api` | API smoke: search, bookings, reviews, Stripe, optional integration with env |
| `pnpm run validate:bnhub:db` | Supabase bookings integrity (read-only) |
| `pnpm run stripe:verify` | Stripe API key sanity |
| `pnpm run validate:bnhub-stripe` | Full Stripe E2E (Prisma path + webhook simulation) |

## Docs

| Doc | Content |
|-----|---------|
| [api-smoke.md](./api-smoke.md) | Env for smoke, curl examples |
| [stripe-validation.md](./stripe-validation.md) | Webhook forwarding, test cards, `[bnhub]` logs |
| [e2e-checklist.md](./e2e-checklist.md) | Manual guest / host / search pass |
| [READINESS.md](./READINESS.md) | Soft launch gate |

## Mobile

- **Dev debug** (`/dev-debug`, `__DEV__` only): API base URL, Supabase URL, anon key present, client initialized, last booking/session/status (in-memory).
- Booking and payment flows: loading states, `Alert` + inline errors, submit guards (no double booking / double checkout).
