# SYBNB / Syria — Final Forensic Audit Report

**Date:** 2026-05-09
**Target:** `apps/syria` on `feature/locale-routing-security-observability-platform`
**Status:** NOT deployed. NOT merged. Audit only.

---

## 1. Current Platform Safety Level

**PREVIEW: CONDITIONALLY SAFE** (needs postinstall fix + env setup)
**PRODUCTION: NOT SAFE** (payment stub only, no live Stripe, needs legal review)

## 2. Prisma Status

| Item | Value |
|------|-------|
| Schema location | `apps/syria/prisma/schema.prisma` |
| Models | 37 (all prefixed `Syria*` or `Sybnb*`) |
| Provider | PostgreSQL |
| URL | `env("DATABASE_URL")` |
| Direct URL | `env("DIRECT_URL")` |
| Output | `../src/generated/prisma` |
| Engine | Binary |
| Isolation | Syria tables use `syria_*` prefix — no overlap with apps/web |

**Risk:** Postinstall runs `prisma generate` which requires `DATABASE_URL`. Same fix needed as apps/web — placeholder fallback for CI/Vercel.

**Status:** NOT yet fixed on the feature branch (only fixed for apps/web services on recovery branch).

## 3. Booking Integrity Status

| Component | Status | Notes |
|-----------|--------|-------|
| `SybnbBooking` model | Present | Dedicated booking model with lifecycle fields |
| `SyriaBooking` model | Present | General booking (separate from SYBNB) |
| Booking actions | `src/actions/bookings.ts`, `src/actions/sybnb-booking.ts` | Two action files |
| Booking version migration | Present | `sybnb_booking_version` migration |
| Risk status migration | Present | `syria_booking_risk_status` migration |
| Admin bookings page | Present | `/admin/bookings`, `/admin/sybnb/bookings` |
| Dashboard bookings | Present | `/dashboard/bookings` |

**Assessment:** Booking schema exists with lifecycle tracking and risk status. Dual booking models (Syria + SYBNB) indicate two booking flows coexist.

## 4. Payment Safety Status

| Check | Result |
|-------|--------|
| Live Stripe connected | **NO** — payment-intent route returns stub IDs only |
| `isInvestorDemoModeActive()` gate | **PRESENT** — blocks real payments in demo mode |
| `PRODUCTION_LOCK_MODE` gate | **PRESENT** — enforced in production + demo |
| `assertSybnbPaymentCompleteAsync` | **PRESENT** — policy assertion before payment |
| Payment preflight script | **PRESENT** — `scripts/payments-preflight.js` |
| Phase 0 payment check | **PRESENT** — `scripts/check-phase0-payments.ts` |
| Idempotency flag | **PRESENT** — `SYBNB_PAYMENT_IDEMPOTENCY_REQUIRED` env |
| Financial audit logging | **PRESENT** — `appendSyriaSybnbCoreAudit()` |
| Security event logging | **PRESENT** — `logSecurityEvent()` |

**Assessment:** Payment system is well-gated. Live Stripe is NOT connected — the route returns stub payment intent IDs. Multiple safety layers exist: demo mode gate, production lock, policy assertion, and audit logging. Payment activation requires explicit env flags AND preflight script approval.

## 5. Fraud/Risk System Status

| Component | Status |
|-----------|--------|
| `syria_booking_risk_status` migration | Present |
| Risk snapshot persistence | Referenced in booking flow |
| Security event logging | `logSecurityEvent()` in payment route |
| Admin monitoring | `/admin/payments-monitor` page |

**Assessment:** Basic fraud/risk framework exists. Not fully audited for production readiness.

## 6. Env/Build Safety Status

| Check | Result |
|-------|--------|
| `DATABASE_URL` required at postinstall | **YES — BLOCKER** |
| Postinstall fallback | **NOT present** (needs fix) |
| `check-env.ts` script | Present — validates `APP_ID=syria`, `DATABASE_URL` |
| `assertEnvSafety` from `@repo/db` | Present — enforces DB URL rules |
| Syria env required by apps/web | **NO** (verified) |
| apps/web env required by Syria | **NO** (verified) |
| `DIRECT_URL` in schema | Present (for Neon pooler migrations) |

**Critical blocker:** `postinstall: "prisma generate --schema=./prisma/schema.prisma"` will crash on Vercel without `DATABASE_URL`. Needs the same placeholder fallback fix applied to services.

## 7. Arabic/RTL Stability Status

| Check | Result |
|-------|--------|
| Default locale | `ar` (Arabic first) |
| Supported locales | `["ar", "en"]` |
| Locale prefix | `always` (`/ar/...`, `/en/...`) |
| Arabic messages | `messages/ar.json` present |
| English messages | `messages/en.json` present |
| RTL `dir` usage | 10+ admin pages use `[dir=rtl]` CSS |
| Root layout | Delegates to `[locale]/layout.tsx` |
| Arabic font | Likely configured in locale layout |
| next-intl integration | Full (routing + messages + translations) |

**Assessment:** Arabic is the PRIMARY locale (not secondary like in LECIPM). RTL support appears more integrated than apps/web since it was designed Arabic-first. Full audit of all 74 pages for RTL correctness would require localhost testing.

## 8. Runtime Stability Status

| System | Status |
|--------|--------|
| No middleware.ts | Confirmed (no middleware) |
| Dynamic rendering | `force-dynamic` on API routes |
| Auth | `getSessionUser()` pattern |
| Runtime env guard | `assertDarlinkRuntimeEnv()` in payment routes |
| Server actions | Present (`src/actions/`) |

**Assessment:** No middleware means simpler request flow. Auth and payment routes have runtime guards.

## 9. API Stability Status

| Count | Type |
|-------|------|
| 74 | API route files (`route.ts`) |
| 74 | Page files (`page.tsx`) |
| 6 | Layouts |

API routes include: SYBNB payment intent, admin endpoints, booking management, property CRUD, messaging, analytics.

## 10. Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Postinstall crashes without `DATABASE_URL` | **HIGH** | Apply placeholder fallback (same as apps/web fix) |
| `@repo/db` import in instrumentation.ts | **MEDIUM** | May pull apps/web Prisma schema; verify isolation |
| 37 Prisma models not migrated to production DB | **MEDIUM** | Run `prisma migrate deploy` before production |
| No middleware = no locale redirect on `/` | **LOW** | Users must navigate to `/ar/` directly |
| Dual booking models (Syria + SYBNB) | **LOW** | Architectural debt, not a blocker |

## 11. Production Blockers

1. **Postinstall `DATABASE_URL` fix** not applied to `apps/syria`
2. **Stripe not connected** — payments return stubs only
3. **Legal review** for Syria marketplace operations not documented
4. **Database migrations** need to be applied to production DB
5. **`@repo/db` dependency** may create unwanted coupling

## 12. Memory Assessment

- 74 pages + 74 API routes = **small footprint** (vs apps/web's 669+1519)
- 37 Prisma models = lightweight schema
- webpack build should complete comfortably under 8GB
- No static generation explosion risk (2 locales × small page count)

## 13. Preview Deployment Readiness

**CONDITIONALLY SAFE** — after applying the postinstall `DATABASE_URL` fallback fix.

Requires:
- Fix postinstall in `apps/syria/package.json`
- Set `DATABASE_URL` in Syria's Vercel project
- Separate Vercel project from apps/web
- Run `prisma migrate deploy` on preview database

## 14. Production Deployment Readiness

**NOT SAFE**

Requires:
- All preview prerequisites
- Stripe Connect configuration for Syria marketplace
- Legal review for Syria operations
- Payment preflight script approval (`pnpm payments:preflight`)
- Host approval system verification
- Fraud monitoring active
- `PRODUCTION_LOCK_MODE` configuration decision

## 15. Syria Isolation Verification

| Check | Result |
|-------|--------|
| apps/web imports apps/syria | **NO** (verified) |
| apps/syria imports apps/web | **NO** (verified) |
| Shared packages used by Syria | `@repo/db`, `@repo/drbrain`, `@repo/offline` |
| Syria Prisma tables | All prefixed `syria_*` or `sybnb_*` |
| Syria has own prisma schema | Yes (37 models, separate from apps/web's 746) |
| Syria has own locale routing | Yes (`["ar", "en"]`, Arabic default) |
| Syria has own messages | Yes (`messages/ar.json`, `messages/en.json`) |

**Assessment:** Syria is well-isolated. Only shared through workspace packages (`@repo/*`), not direct app imports.

## 16. Exact Unstable Systems

| System | Issue |
|--------|-------|
| Postinstall | Crashes without `DATABASE_URL` |
| `@repo/db` import | May create schema coupling |
| Live payments | Stub only — not connected |

## 17. Recommended Next Step

1. Apply postinstall `DATABASE_URL` fallback to `apps/syria/package.json`
2. Create separate Vercel project for Syria
3. Set Syria-specific env vars
4. Deploy Syria preview independently
5. Verify Arabic rendering on preview
6. Run payment preflight when ready for payment activation

---

## Final Decisions

**Preview deployment: CONDITIONALLY SAFE** (needs postinstall fix first)

**Production deployment: NOT SAFE** (payment stubs, no Stripe, no legal review)

**Nothing deployed. Nothing merged. Audit complete.**
