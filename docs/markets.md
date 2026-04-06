# Markets

## Two layers

1. **Static catalog** — synchronous hints for tests and documentation: `apps/web/lib/markets/catalog.ts` (`defaultMarket`, `syriaMarket`, `getMarketConfig`).
2. **Resolved market** — production behavior from **database + admin launch settings**: `getResolvedMarket()` in `apps/web/lib/markets/resolve-market.ts` (re-exported from `lib/markets/index.ts`).

Default global flow keeps **instant booking**, **online payments** (Stripe), and **normal** contact UX. Syria-oriented configuration uses **request** booking, **manual** payment, **contact-first** UX, and **no online card checkout**.

## Market config view

`toMarketConfigView()` maps internal enums to a stable UI-facing shape (`bookingMode`, `paymentMode`, `contactMode`, `onlinePaymentsEnabled`). See `apps/web/lib/markets/market-config-view.ts`.

## Related

- [docs/markets/SYRIA-LAUNCH-MODE.md](./markets/SYRIA-LAUNCH-MODE.md)
