# Hub system audit (BNHub → LECIPM Hub Engine)

## 1. Shared marketplace logic (today)

- **Search & discovery:** `lib/bnhub/listings.ts`, `build-search-where`, filters, AI sort hooks, behavior learning.
- **Promotions / growth:** `lib/promotions`, marketing bridges, featured listings.
- **Legal / contracts:** `config/hubs.ts` legal hub configs (parallel to engine registry — legal vs product hub).
- **SEO / public URLs:** JSON-LD, canonical paths under `/bnhub/*` and listing codes.

## 2. Shared booking / payment / messaging (today)

- **Pricing:** `lib/bnhub/booking-pricing.ts`, Stripe checkout, webhooks, `modules/bnhub-payments/*`.
- **Bookings:** `lib/bnhub/booking.ts`, availability, Prisma `Booking` / `Payment`.
- **Messaging:** booking-scoped threads, host autopilot triggers, guest experience engine.

## 3. BNHub-specific stays logic (must stay isolated)

- Short-term listing model (`ShortTermListing`), nightly availability slots, BNHub host onboarding, stays filters, trust/review, BNHub marketing admin routes.

## 4. Reusable dashboard patterns (today)

- `HubLayout`, `HubSidebarNav`, `hubNavigation`, `PremiumSectionCard`, `HubStatCard`, `HubQuickActionsRow`, role-based dashboards under `app/(dashboard)/dashboard/*/`.

## 5. Reusable AI / autopilot hooks (today)

- Host autopilot (`lib/ai/autopilot/*`), conversion signals, BNHub ranking, fraud/loyalty where wired — surfaced as flags on the BNHub engine config.

## 6. Reusable design system pieces (today)

- `lib/hub/themes.ts` — black + gold premium shell.
- `components/hub/*` — layout, switcher, stats, section cards.

## What must remain BNHub-specific

- Prisma models for stays, Stripe Connect flows for hosts, BNHub public routes (`/bnhub/*`, `/search/bnhub`), listing detail and checkout flows tied to short-term semantics.

## What becomes generic hub infrastructure

- **Registry:** `lib/hub/core/hub-registry.ts` — metadata, modes, AI flags, dashboard sections, search config.
- **Adapters:** `lib/bnhub/hub/bnhub-adapter.ts` — maps generic `HubBookingEngine` / `HubPricingEngine` to stays.
- **UI:** `components/hub/HubShell`, `HubHero`, `HubNavTabs`, etc. — shared visual language.
- **Routing:** `lib/hub/router.ts` extended `HubKey` + `/hub/[hubKey]` for new verticals without moving BNHub URLs.

## Files to migrate gradually into shared engines

- Navigation: keep `lib/hub/navigation.ts` for legacy URLs; new hubs use `hubEngineNavItems()` from registry.
- Themes: single source remains `getHubTheme` + registry `themeKey`.

## UI patterns to reuse

- Black (`#0b0b0b`) + gold (`#D4AF37` / `var(--color-premium-gold)`), bordered cards, gold top accent strip, hub switcher.

## Anti-patterns

- Copying entire `app/bnhub` trees for CarHub — use `/hub/[hubKey]` + adapters instead.
- Duplicating Stripe or booking tables per hub — use adapters over shared primitives where possible.
