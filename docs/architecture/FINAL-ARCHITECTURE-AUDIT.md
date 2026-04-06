# Final architecture audit — LECIPM Manager

This document captures the **current** state (post–Hub Engine work) and **stability risks**. It is a guide for incremental cleanup, not a mandate for a big-bang rewrite.

## 1. Apps structure

| Area | Location | Role |
|------|-----------|------|
| Web (Next.js App Router) | `apps/web/app/` | Pages, API routes, layouts |
| Web UI | `apps/web/components/` | React components |
| Web domain logic | `apps/web/lib/` | Services, AI, BNHub, payments, markets, i18n |
| Web data | `apps/web/prisma/` | Prisma schema + migrations |
| Mobile (Expo) | `apps/mobile/src/` | Screens, services, theme |
| Shared packages | `packages/types`, `packages/config`, `packages/ui` | Types, TS config, UI kit |
| Docs | `docs/architecture`, `docs/ai`, etc. | Architecture and product docs |

**Observation:** `apps/web/lib` is large and multi-domain by design; boundaries are **logical** (folders), not enforced by compile-time module boundaries.

## 2. Duplicated or overlapping modules

- **Hub / legal hub:** `config/hubs.ts` (legal/verification) vs `lib/hub/core/hub-registry.ts` (product verticals) — complementary; avoid merging keys without clear ownership.
- **API response shapes:** Some routes return ad-hoc JSON; `packages/types` defines `ApiResponse<T>`; **`lib/api/api-response.ts`** now provides `jsonSuccess` / `jsonFailure` aligned with that type for gradual adoption.
- **Logging:** `lib/logging/structured.ts` for stdout JSON; `lib/observability.ts` for persisted `platformEvent` rows — both valid; use **`lib/logging/event-categories.ts`** for consistent `eventType` naming.

## 3. Oversized files (known hotspots)

- Large **page** files under `app/(dashboard)/` and `app/admin/` (host, AI, investor) — business logic sometimes inlined; **priority** is extraction into hooks/services over time.
- **`lib/bnhub/listings.ts`** — central search + ranking; high cohesion but long; split only when a second maintainer path is clear.
- **AI** — multiple engines under `lib/ai/`; consolidation is **ongoing**; duplicate scoring risk is mitigated by routing new work through shared engines and `lib/ai/index.ts` exports where applicable.

## 4. Circular dependencies

- No systematic dependency-cruiser run in this pass. **Risk areas:** `lib/ai/*` ↔ `lib/bnhub/*` when imports reach “up” into UI. **Rule:** AI modules should depend on **services and types**, not React.

## 5. Mixed concerns

- **Route handlers:** Many `app/api/**/route.ts` files still mix validation, auth, and orchestration. **Target:** validate → authorize → **service** → respond (see `lib/api/api-response.ts`).
- **Components:** Some dashboards embed fetch + rules; **target:** hooks + domain services.

## 6. Unstable boundaries

- **Payments:** Stripe webhooks and `lib/stripe/*`, `modules/bnhub-payments/*` — critical; changes require regression tests.
- **BNHub public SEO routes:** Must not move without redirects (`/bnhub/*`, listing codes).

## 7. AI / autopilot integration points

- `lib/ai/engine.ts` — evaluation entrypoints.
- `lib/ai/autopilot/*` — host autopilot.
- `lib/ai/observability/*` — metrics/tracer.
- Hub registry **AI flags** for BNHub: `lib/hub/core/hub-registry.ts` + `lib/bnhub/hub/bnhub-ai-config.ts`.

## 8. Booking / listing / payment domain boundaries

| Domain | Primary locations |
|--------|-------------------|
| Listings (stays) | `lib/bnhub/listings.ts`, Prisma `ShortTermListing` |
| Bookings | `lib/bnhub/booking.ts`, `lib/bnhub/booking-pricing.ts` |
| Payments | `lib/stripe/*`, `app/api/stripe/*`, `modules/bnhub-payments/*`, `lib/observability.ts` money-adjacent events |
| Money JSON | `lib/payments/*`, `lib/bookings/money.ts` |

## 9. Mobile / web shared concerns

- Mobile **must** call **HTTP APIs**, not import `apps/web/lib` (different bundle). Services live under `apps/mobile/src/services/*` (`apiClient.ts`, `bookingService.mobile.ts`, etc.).
- **Shared types:** Prefer `packages/types` and documented API contracts.

## 10. i18n / market mode

- **Locales:** `apps/web/lib/i18n/*` (messages, direction, server translate).
- **Markets:** `apps/web/lib/markets/*` (`getResolvedMarket`, Syria definition, payment/booking mode).
- **RTL:** `direction.ts` + Arabic font in root layout.

## 11. Top refactor priorities (safe order)

1. Adopt **`jsonSuccess` / `jsonFailure`** on **new** and high-churn API routes.
2. Use **`platformEventType`** for new platform events.
3. Extract **service functions** from the largest API routes (booking, autopilot triggers) one file at a time.
4. Split **largest dashboard pages** into section components + data loaders.
5. Add **integration tests** around payment webhooks and BNHub checkout (already partially covered).

## 12. What this audit does not do

- It does not remove legacy routes or flags without a separate deprecation review.
- It does not merge AI submodules in one PR; that remains a **sequential** effort.
