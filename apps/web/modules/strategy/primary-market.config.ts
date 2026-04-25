/**
 * Core geographic focus: win depth in Montréal before scaling Québec-wide.
 * IDs are resolved at runtime from `City` (see `leadership-metrics.data.ts`).
 */

export type MarketPhase = "primary" | "secondary";

export type PrimaryMarketConfig = {
  /** Stable slug in `lecipm_cities` (City.slug) */
  primaryCitySlug: string;
  /** Human label */
  primaryLabel: string;
  /** Broader region after primary is healthy — same country, larger TAM */
  nextRegionLabel: string;
  /** ISO-like region code for user/deal scoping (Québec) */
  regionCode: "QC";
  countryCode: "CA";
  /** One-segment focus: do not expand messaging spend until primary thresholds met (see leadership engine) */
  segmentFocus: "montreal_metro_brokers" | "quebec_brokers";
  notes: string;
};

export const PRIMARY_MARKET: PrimaryMarketConfig = {
  primaryCitySlug: "montreal",
  primaryLabel: "Montréal (metro)",
  nextRegionLabel: "Québec",
  regionCode: "QC",
  countryCode: "CA",
  segmentFocus: "montreal_metro_brokers",
  notes:
    "Concentrate GTM, partnerships, and product proof in Montréal first; treat Québec as phase two once repeatable broker motion exists.",
};
