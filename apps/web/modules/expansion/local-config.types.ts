/**
 * Regional configuration loaded from DB (`ExpansionCountry.regionalConfigJson`) and optional env overlays.
 * No country-specific branching in code — keys are data-driven.
 */

export type RegionalTaxEntry = {
  key: string;
  label: string;
  /** Basis points (10000 = 100%). Optional — informational until billing consumes it. */
  rateBps?: number;
  notes?: string;
};

export type RegionalFeeEntry = {
  key: string;
  label: string;
  amountCents?: number;
  notes?: string;
};

export type RegionalRuleEntry = {
  key: string;
  description: string;
};

/** Stored in `regional_config_json` — extend without migrations when possible. */
export type RegionalConfigV1 = {
  version?: number;
  taxes?: RegionalTaxEntry[];
  fees?: RegionalFeeEntry[];
  rules?: RegionalRuleEntry[];
  /** Feature flags for this country (e.g. bnhub_stays, fsbo_publish). */
  enabledFeatures?: string[];
  /** LECIPM city slugs considered “open” for GTM (optional; city rows also carry flags). */
  enabledCitySlugs?: string[];
  /** UI copy keys only — not legal text. */
  complianceHints?: Record<string, string>;
};
