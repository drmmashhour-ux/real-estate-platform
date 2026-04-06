export type { BookingMode, ContactDisplayMode, MarketCode, PaymentMode, ResolvedMarket } from "./types";
export { defaultMarketDefinition } from "./default";
export { syriaMarketDefinition } from "./syria";
export { getResolvedMarket } from "./resolve-market";
export { toMarketConfigView, type MarketConfigView } from "./market-config-view";
/** Static catalog (sync hints); live behavior uses `getResolvedMarket`. */
export { defaultMarket, syriaMarket, getMarketConfig, type MarketConfig } from "./catalog";
