# Syria soft-launch market mode

## Resolution

- `getResolvedMarket()` in `apps/web/lib/markets/resolve-market.ts` merges `PlatformMarketLaunchSettings` with static definitions (`default.ts`, `syria.ts`).
- Syria profile activates when admin enables Syria mode, sets active market to `syria`, or `NEXT_PUBLIC_MARKET_CODE=syria`.

## Behavior (static + DB)

- **Currency**: SYP by default (overridable via `defaultDisplayCurrency` in settings).
- **Online payments**: typically **off** when Syria profile is active; **manual payment tracking** on.
- **Booking**: `manual_first` / request-style flows; do not assume instant paid confirmation.
- **UX**: `contactFirstEmphasis` drives ribbons/banners (`market.*` translation keys).

## Config view

- `toMarketConfigView(resolved)` in `lib/markets/market-config-view.ts` exposes a spec-aligned `MarketConfigView` (`bookingMode: "request"`, `contactMode: "contact-first"`, etc.) without breaking the internal `ResolvedMarket` model.

## Client hook

- `useMarketConfig()` in `apps/web/hooks/useMarketConfig.ts` reads `GET /api/market/resolved` for contact-first and payment capability checks in components.

## AI / copy

- Autopilot and content generators append contact-first constraint text from `contentEngine.constraints.contactFirstMarket` when the market requires it.
