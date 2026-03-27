/** Browse UI — modes, labels, and static paths (index 0 often overridden for “by yourself”). */

export const MODES = ["buy", "rent", "sell"] as const;
export type BrowseMode = (typeof MODES)[number];

/** @deprecated Use `BrowseMode` */
export type HomeSearchMode = BrowseMode;

export const MODE_OPTIONS: Record<BrowseMode, readonly [string, string, string]> = {
  buy: ["Buy by yourself", "Buy with platform broker", "Buy with listing broker"],
  rent: ["Rent by yourself", "Rent with platform broker", "Rent with listing broker"],
  sell: ["Sell by yourself", "Sell with platform broker", "Sell with listing broker"],
};

/** Static paths for MODE_OPTIONS; index 0 overridden at runtime for buy/rent “by yourself”. */
export const MODE_OPTION_STATIC_HREFS: Record<BrowseMode, readonly [string, string, string]> = {
  buy: ["/listings", "/buying/with-platform-broker", "/buying/with-selected-broker"],
  sell: ["/selling/by-yourself", "/selling/with-platform-broker", "/selling/with-certified-broker"],
  rent: ["/listings", "/rent", "/rent"],
};

/** @deprecated Use `MODE_OPTIONS` */
export const SUB_OPTIONS = MODE_OPTIONS;
/** @deprecated Use `MODE_OPTION_STATIC_HREFS` */
export const SUB_OPTION_STATIC_HREFS = MODE_OPTION_STATIC_HREFS;
