# Incident response — bookings, payments, locales

## Stripe checkout failures

1. Open **Admin → Operations monitoring** (`/admin/monitoring`) and check **Payments & Stripe webhooks** plus **Alerts**.
2. Inspect `ErrorEvent` rows for `/api/stripe/checkout` (table on the same page).
3. Verify env: `STRIPE_SECRET_KEY`, Connect destination, listing price quote.
4. Reproduce with a single booking in `pnpm test:e2e:launch` scenario 1 after keys are correct.

## Webhook / booking mismatch

1. Compare **completed** payments vs **webhook** row counts in the monitoring snapshot.
2. Search logs for duplicate webhook handling / idempotency keys.
3. Inspect `growth_stripe_webhook_logs` and `payments.stripe_checkout_session_id` for the booking.

## Manual payment (Syria-style)

1. Confirm **platform_market_launch_settings**: `syriaModeEnabled`, `onlinePaymentsEnabled`, `manualPaymentTrackingEnabled`.
2. Use **Booking ops** (`/admin/bookings-ops`) for rows with manual settlement **PENDING**.
3. Validate `PATCH /api/bookings/manual-payment` auth (host vs admin) and `BookingManualPaymentEvent` audit rows.

## Localization (EN / FR / AR, RTL)

1. Check **Locale funnel** on the monitoring dashboard (`language_switched` counts).
2. For layout regressions, read the latest **`e2e/reports/failures/*.md`** from a failed Arabic scenario.
3. Fix bundles under `apps/web/messages/` and i18n provider wiring; verify `html[dir=rtl]` for `mi_locale=ar`.

## Acting on red / yellow health

- **Red** on payments or errors: pause marketing spend, notify on-call, open Stripe dashboard + DB row for affected bookings.
- **Yellow** on manual backlog: assign ops to clear PENDING settlements and host approvals.
- **Green** across board: keep scheduled E2E (`pnpm test:e2e:launch`) before major releases.
