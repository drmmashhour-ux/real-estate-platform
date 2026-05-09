# SYBNB / Syria — Preview Readiness

**Date:** 2026-05-09
**Status:** NOT deployed. Stabilization complete.

## Current Readiness Level

**Preview: SAFE** (after applying fixes on this branch)
**Production: NOT SAFE** (payments are stubs, no Stripe, no legal review)

## Required Environment Variables

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Syria-specific PostgreSQL URL (must NOT contain "lecipm") | **Yes** |
| `DIRECT_URL` | Same or direct (non-pooled) URL for migrations | **Yes** |
| `APP_ID` | `syria` | **Yes** |
| `NODE_ENV` | `production` for deploy, `development` for dev | Yes |
| `PRODUCTION_LOCK_MODE` | `true` (keep payments locked) | **Recommended** |
| `INVESTOR_DEMO_MODE` | `true` or `false` per preview purpose | Optional |
| `STRIPE_SECRET_KEY` | UNSET or `sk_test_...` only | Optional |

**CRITICAL:** DATABASE_URL must NOT contain "lecipm" — env guard blocks it.

## Payment Safety Status

- Stripe: **NOT connected** — returns stub payment intent IDs
- `PRODUCTION_LOCK_MODE`: blocks real payments in production
- `isInvestorDemoModeActive()`: gates demo vs real flows
- `assertSybnbPaymentCompleteAsync()`: policy assertion before payment
- Payment preflight script: `pnpm payments:preflight`
- Idempotency: `SYBNB_PAYMENT_IDEMPOTENCY_REQUIRED` env flag

## Booking Integrity Status

- `SybnbBooking` + `SyriaBooking` models: present with lifecycle fields
- Risk status tracking: migration present
- Admin booking management: `/admin/bookings`, `/admin/sybnb/bookings`

## Arabic/RTL Status

- Default locale: `ar` (Arabic-first)
- RTL rendering: integrated in components
- Arabic messages: `messages/ar.json`
- English fallback: `messages/en.json`

## Prisma Status

- Schema: **valid** (37 models)
- Client: **generates** (v6.19.3, binary engine)
- Postinstall: **FIXED** with placeholder fallback
- Runtime guard: **ACTIVE** (blocks placeholder URL)
- Tables: all `syria_*` / `sybnb_*` prefixed

## Localhost Route Verification

| Route | Status | Code |
|-------|--------|------|
| `/` | PASS | 307 (redirect to /ar) |
| `/ar` | PASS | 200 |
| `/en` | PASS | 200 |
| `/ar/login` | PASS | 200 |
| `/ar/sybnb` | PASS | 200 |
| `/ar/dashboard` | PASS | 307 (redirect, auth required) |
| `/ar/admin` | PASS | 307 (redirect, auth required) |
| `/ar/demo` | PASS | 200 |
| `/en/sybnb` | PASS | 200 |
| `/en/login` | PASS | 200 |
| `/api/health` | PASS | 200 |
| `/api/sybnb/payment-intent` | PASS | 405 (POST only, expected) |

## Disabled/Degraded Systems

| System | Status | Reason |
|--------|--------|--------|
| Stripe payments | Stub | No keys, returns fake intent IDs |
| File uploads | Degraded | No Supabase storage configured |
| Email notifications | Disabled | No Resend key |

## Preview Deployment Checklist

- [ ] Create separate Vercel project for Syria
- [ ] Set DATABASE_URL (must NOT contain "lecipm")
- [ ] Set DIRECT_URL
- [ ] Set APP_ID=syria
- [ ] Set PRODUCTION_LOCK_MODE=true
- [ ] Leave STRIPE_SECRET_KEY unset
- [ ] Deploy preview
- [ ] Verify `/ar` loads
- [ ] Verify `/ar/sybnb` loads
- [ ] Verify `/api/health` returns 200
- [ ] Check logs for "placeholder" errors

## Production Blockers

1. Stripe not connected (payments are stubs)
2. No legal review for Syria marketplace operations
3. No host verification system tested in production
4. No fraud monitoring verified for live use
5. Payment preflight not passed

## Rollback Plan

Vercel instant rollback via dashboard, or revert commit and redeploy.
