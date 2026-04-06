# Final architecture — LECIPM Manager

## Goals

- **One platform** (web + mobile + AI) with **clear domain boundaries** and **incremental** improvement.
- **Black + gold** design system unchanged (`#0b0b0b`, `#D4AF37` / `var(--color-premium-gold)`).
- **Syria-ready** and other markets via `lib/markets` — no forked product repos.

## Folder structure (effective)

```
apps/web/
  app/                 # Next.js App Router — pages & API routes
  components/          # UI (hub shell, dashboards, marketing)
  lib/
    ai/                # Engines, autopilot, fraud, pricing AI, observability
    api/               # Route helpers (e.g. api-response.ts)
    auth/              # Session, guards (as present)
    bnhub/             # Stays marketplace domain + hub adapter under bnhub/hub/
    hub/               # LECIPM Hub Engine (registry, core)
    i18n/              # Locales, RTL, server translate
    logging/           # Structured logs + event category prefixes
    markets/           # Market resolution (default, Syria, …)
    payments/          # Money types, events (as present)
    prisma/            # (schema lives under apps/web/prisma)
    observability.ts   # Platform events + health (persisted)
  prisma/

apps/mobile/src/
  screens/ services/ theme/ locales/ …

docs/
  architecture/  ai/  i18n/  markets/  investors/
```

## Domain boundaries

1. **AI** — `lib/ai/**`; decisions go through shared engines; avoid UI imports inside `lib/ai`.
2. **BNHub** — `lib/bnhub/**`, BNHub routes under `app/bnhub`, `app/api/bnhub`, `app/api/bookings` where applicable.
3. **Payments** — Stripe + webhook routes + `modules/bnhub-payments`; money truth in cents and Prisma `Payment` / `PlatformPayment`.
4. **Admin / investor** — `app/admin`, `app/(dashboard)/dashboard/investor`, investor APIs; metrics aggregation stays server-side.
5. **Localization / market** — `lib/i18n`, `lib/markets`; `ResolvedMarket` drives payment/booking **mode**, not separate codebases.

## Request flow (web API)

1. Parse input (prefer **zod** where routes already use it).
2. Authorize (session, role, resource ownership).
3. Call **domain service** (not inline Prisma in 50-line handlers for new code).
4. Return JSON — prefer **`jsonSuccess` / `jsonFailure`** from `lib/api/api-response.ts` for new routes.
5. Log errors via **`logError`** from `lib/logging` + `logApiRouteError` in dev for API debugging.

## AI flow (high level)

1. Triggers (cron, user action, webhook) call **domain service**.
2. Service invokes **AI engine** or autopilot module with **typed** inputs.
3. Results logged via **`logAiDecision`** / structured logs; persisted events use **`recordPlatformEvent`** with **`platformEventType(prefix, action)`** from `lib/logging/event-categories.ts`.
4. **Policies** (autonomy, fraud) gate execution — single source in policy modules, not duplicated in UI.

## Booking / payment flow (BNHub)

1. Quote: `computeBookingPricing` + loyalty/adapters as configured.
2. Checkout: server-side amount; Stripe session; webhook confirms.
3. Payouts / orchestration: existing BNHub money layer; do not bypass webhooks.

## Mobile / web boundary

- Mobile consumes **HTTP APIs only**; shared **types** from `packages/types` or documented response shapes.
- **`apps/mobile/src/lib/hub-mobile-types.ts`** mirrors hub shell concepts for tabs.

## i18n / market mode boundaries

- **Locale:** `lib/i18n` — English default; French LTR; Arabic RTL via `direction.ts` + fonts.
- **Market:** `getResolvedMarket()` — switches payment/booking/contact behavior; **Syria** definitions live in `lib/markets/syria.ts` and catalog.

## How to add features safely

1. Place domain logic in **`lib/<domain>/`**.
2. Expose via **thin** `route.ts` calling service.
3. Add tests next to domain or under `__tests__`.
4. For cross-cutting events, use **`platformEventType`** + `recordPlatformEvent`.

## Anti-patterns

- Copy-pasting BNHub booking logic into mobile — use APIs.
- New `ApiResponse` shapes per route — use **`ApiResponse<T>`** + `jsonSuccess`/`jsonFailure`.
- Duplicate AI scoring in multiple files — extend shared engine or add a single helper used by all callers.
- Client-trusted admin or payment amounts — always validate server-side.

## Related docs

- `HUB-SYSTEM.md`, `HUB-REGISTRY.md`, `HUB-ADAPTERS.md`
- `docs/i18n/ARCHITECTURE.md`, `docs/markets/MARKET-MODE.md`
- `OBSERVABILITY-CONVENTIONS.md` — structured logs vs persisted events vs AI logging
- `apps/web/lib/test/README.md` — test colocation and mock conventions
- `FINAL-ARCHITECTURE-AUDIT.md`
