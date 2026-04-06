# Manual E2E checklist (staging)

Complete before calling soft launch **READY**. Use Stripe **test** mode unless explicitly validating production.

## Guest

- [ ] Browse → property → booking → **Confirm booking** (loading; single submit; clear error if dates unavailable).
- [ ] Payment → **Pay now** opens Stripe (no double-open race; button disabled while loading).
- [ ] **Success path**: payment succeeds → return to app → booking status becomes **paid** (poll / confirmation screen).
- [ ] **Cancel path**: cancel in Stripe → payment-cancel screen → retry payment works.
- [ ] **Interrupted**: app backgrounded during checkout → resume → status still consistent; no duplicate charge (webhook idempotent).
- [ ] **AI search**: query → results → open property.

## Signed-in (if applicable)

- [ ] My bookings lists expected rows; ownership rules match server.

## Host

- [ ] Earnings / Connect flows as designed (see Stripe Connect docs).

## Automated (same session)

- [ ] `pnpm run test:bnhub:api` — exit 0
- [ ] `pnpm run validate:bnhub:db` — exit 0 or warnings reviewed

Then apply [READINESS.md](./READINESS.md).
