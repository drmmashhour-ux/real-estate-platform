# Market mode (Syria-ready / multi-market)

## Source of truth

- **Runtime resolution:** `apps/web/lib/markets/resolve-market.ts` → `getResolvedMarket()`
- **Definitions:** `default.ts`, `syria.ts`, `catalog.ts`
- **Types:** `apps/web/lib/markets/types.ts` — `MarketCode`, `PaymentMode`, `BookingMode`, `ResolvedMarket`

## Behavior

- **Payment mode:** `online` | `manual` | `mixed` — controls whether Stripe checkout is offered vs manual settlement flows.
- **Booking mode:** e.g. `manual_first` for markets where online capture is not default.
- **Contact display:** `ContactDisplayMode` for CRM/lead emphasis.

## Syria-ready

- `syriaMarketDefinition` and `MarketCode` include `"syria"` — no separate product fork; feature work extends **definitions + UI** under the same codebase.

## Cross-reference

- Re-exports for consumers: `apps/web/lib/types/cross-domain.ts` (`ResolvedMarket`, etc.)
