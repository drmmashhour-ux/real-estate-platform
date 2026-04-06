# Soft launch readiness gate

Use this after automated checks and a staging manual run.

## READY FOR SOFT LAUNCH

All of the following:

1. **Guest booking → checkout → webhook → paid** works reliably on staging with Stripe **test** mode (or production keys in a controlled environment).
2. **`pnpm run validate:bnhub:db`** exits **0** — no unresolved **error**-severity integrity findings (overlapping paid ranges, invalid totals, etc.). Warnings may be accepted if documented.
3. **`pnpm run test:bnhub:api`** exits **0** — or failures are understood and waived (e.g. optional integration blocks skipped).
4. **Manual E2E** in [e2e-checklist.md](./e2e-checklist.md) completed on staging without critical mobile crashes or broken flows.

## NOT READY

Any of the following:

- Webhook does not consistently move Supabase `bookings.status` to **paid** after successful Checkout.
- DB validator reports **error**-severity issues (e.g. `OVERLAPPING_PAID_RANGES`, `INVALID_TOTAL`) that are not waived.
- Core API smoke cases fail (search, validation errors, Stripe error paths).
- Critical mobile regressions: payment, booking create, confirmation, or search unusable.

## Evidence to collect

- Screenshot or log line showing `[bnhub] guest_booking webhook` with `phase: marked_paid` and matching `bookingId` / `sessionId` / `paymentIntentId`.
- Output of `validate:bnhub:db` and `test:bnhub:api` attached to the release note.

**Default stance:** If in doubt, classify as **NOT READY** until the gap is understood.
