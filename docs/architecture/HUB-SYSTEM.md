# LECIPM Hub Engine

## Purpose

The **LECIPM Hub Engine** is a product-level framework for multiple vertical hubs (BNHub stays, future CarHub, ServiceHub, InvestorHub shell, Broker vertical) on one platform: shared **design language**, **registry**, **booking/pricing contracts**, **AI flags**, and **analytics** — without duplicating BNHub or rewriting existing routes.

## Layers

1. **Registry** (`lib/hub/core/hub-registry.ts`) — canonical hub metadata, modes, features, navigation, search schema, dashboard sections.
2. **Adapters** — per hub (`lib/bnhub/hub/bnhub-adapter.ts`, future `lib/carhub/...`) implementing `HubBookingEngine` and `HubPricingEngine`.
3. **UI** — `components/hub/*` premium shell components (`HubShell`, `HubHero`, …) aligned with `lib/hub/themes.ts`.
4. **Routing** — existing BNHub URLs unchanged; additional verticals use `/hub/[hubKey]` (see `app/hub/[hubKey]/page.tsx`).
5. **i18n** — `lib/hub/core/hub-i18n.ts` resolves label keys; extend `DICT` for FR/AR.

## Mobile (Expo)

- `lib/hub/core/hub-mobile.ts` defines portable tab shapes; web routes remain canonical — apps mirror `hubKey` + paths.

## Market / policy

- `lib/hub/policies/market-policy.ts` — per-market gates (payments, locales) without forking hub code.

## Environment flags

| Variable | Effect |
|---------|--------|
| `NEXT_PUBLIC_HUB_CAR_ENABLED` | Enables CarHub beta + switcher + `/hub/carhub` |
| `NEXT_PUBLIC_HUB_SERVICE_ENABLED` | Enables ServiceHub placeholder |
| `NEXT_PUBLIC_HUB_INVESTOR_SHELL_ENABLED` | Enables InvestorHub internal shell |

## Non-goals

- Replacing BNHub public SEO paths.
- One-size-fits-all Prisma schema for all verticals — adapters own domain tables when introduced.

## New hub scaffold (contract)

1. **Registry:** add a `registerHub({ ... })` block in `hub-registry.ts` (or split init file later) with `key`, `routeBase`, modes, `features`, `ai`, `search`, `dashboardSections`, `themeKey`.
2. **Theme:** add `themeKey` entry in `lib/hub/themes.ts` (usually `LECIPM_PREMIUM_HUB` clone).
3. **Router:** add `HubKey` + `HUB_PATHS` in `lib/hub/router.ts` if the hub appears in the switcher.
4. **Adapter:** implement `HubBookingEngine` / `HubPricingEngine` and register via `registerBookingEngine` / `registerPricingEngine` when ready.
5. **UI:** ship first screen under `app/hub/[hubKey]/page.tsx` (already dynamic) or dedicated segment routes as the vertical matures.
6. **i18n:** add `labelKey` / `descriptionKey` entries to `lib/hub/core/hub-i18n.ts` `DICT`.
