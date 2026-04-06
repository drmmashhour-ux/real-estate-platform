# BNHub money — today live checklist

## 0. Env (apps/web)

- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (match `stripe listen` secret)
- `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3001` for web dev port)

## 1. Migrate (local / dev DB)

```bash
cd apps/web && pnpm exec prisma migrate deploy
```

## 2. Schema smoke (optional)

```bash
cd apps/web && pnpm exec tsx scripts/bnhub-money-layer-schema-verify.ts
```

## 3. Run app

```bash
cd apps/web && pnpm dev
```

## 4. Stripe webhook (separate terminal)

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

Copy `whsec_…` into `STRIPE_WEBHOOK_SECRET`, restart `pnpm dev`.

## 5. Prisma booking checkout test (logged-in guest)

1. Create a BNHub booking (PENDING + Payment PENDING) via your normal UI or API.
2. `POST /api/stripe/checkout` with `paymentType: booking`, `bookingId`, `successUrl`, `cancelUrl`, `amountCents` from server gate.
3. Complete Checkout in Stripe test mode.

## 6. Webhook verification

- Stripe CLI shows `checkout.session.completed`.
- DB: `payments.status` = `COMPLETED`, `money_breakdown_json` set, `paid_at` set.
- DB: `orchestrated_payouts` row `scheduled` (online market + Connect ready) or `bnhub_manual_host_payouts` `queued` (manual / Connect not ready).

## 7. Payout runner (cron secret)

```bash
curl -sS -X POST "http://localhost:3001/api/internal/payouts/run" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Requires `scheduled_at <= now()` on the payout row (default: check-in + 24h). For an immediate test, set the booking `checkIn` in the past far enough that `scheduledAt` is in the past, or temporarily adjust the row in DB.

## 8. Host UI

- Open `/host/earnings` (signed-in host).

## 9. Admin UI

- Open `/admin/payouts` (ADMIN role).
- Ledger section: `/api/admin/payouts` data; retry failed Stripe row; mark manual paid.

## 10. Seed (only if no users/listings)

Use your existing seed path, e.g.:

```bash
cd apps/web && pnpm exec tsx scripts/seed-demo-data.ts
```

(Adjust to the script your repo documents for BNHub demo hosts.)
