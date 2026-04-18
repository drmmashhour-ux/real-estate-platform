/**
 * LECIPM Canada — product boundary for `apps/web` only.
 *
 * Multi-market routing / URL segments live in `./countries.ts`; do not confuse the two.
 * Syria and UAE each own their own `country.ts` beside their app.
 */

export const COUNTRY_APP_CONFIG = {
  /** Must match APP_CONTEXT / assertLecipmRuntimeEnv */
  appContext: "lecipm",
  productKey: "lecipm-canada",
  legalMarket: "CA",
  /** ISO 4217 — product default for LECIPM listings when not overridden */
  defaultCurrency: "CAD",
  defaultLocales: ["en", "fr"] as const,
} as const;

export type CountryAppConfig = typeof COUNTRY_APP_CONFIG;

/**
 * Money OS market runtime — **this deployment only**. Never import other apps (`apps/syria`, etc.).
 * Override with `MOS_MARKET_CODE` for staging multi-market demos (same codebase, isolated DB).
 */
export type MosAutomationSurface =
  | "broker_outreach_draft"
  | "daily_action_list"
  | "listing_quality_highlight"
  | "pricing_advisory_copy";

export type MosMarketRuntime = {
  countryCode: string;
  currency: string;
  languageDefault: string;
  revenueModelNote: string;
  pricingRulesNote: string;
  allowedSafeAutomations: MosAutomationSurface[];
};

const MOS_PRESETS: Record<string, MosMarketRuntime> = {
  CA: {
    countryCode: "CA",
    currency: "CAD",
    languageDefault: "en",
    revenueModelNote: "Broker commissions + lead unlocks + BNHub booking fees.",
    pricingRulesNote: "Provincial advertising norms — advisory pricing only via MOS.",
    allowedSafeAutomations: [
      "broker_outreach_draft",
      "daily_action_list",
      "listing_quality_highlight",
      "pricing_advisory_copy",
    ],
  },
  SY: {
    countryCode: "SY",
    currency: "USD",
    languageDefault: "ar",
    revenueModelNote: "Listing-led fees + simplified broker tiers (deployment-specific).",
    pricingRulesNote: "Manual price confirmation — MOS never applies rates.",
    allowedSafeAutomations: ["broker_outreach_draft", "daily_action_list", "listing_quality_highlight"],
  },
  AE: {
    countryCode: "AE",
    currency: "AED",
    languageDefault: "en",
    revenueModelNote: "Rental-heavy pipelines + broker bundles.",
    pricingRulesNote: "RERA-style diligence remains manual — automation is suggest-only.",
    allowedSafeAutomations: [
      "broker_outreach_draft",
      "daily_action_list",
      "listing_quality_highlight",
      "pricing_advisory_copy",
    ],
  },
};

export function getMosMarketRuntime(): MosMarketRuntime {
  const raw = process.env.MOS_MARKET_CODE?.trim().toUpperCase();
  const code = raw && MOS_PRESETS[raw] ? raw : COUNTRY_APP_CONFIG.legalMarket;
  return MOS_PRESETS[code] ?? MOS_PRESETS.CA!;
}

/** Preset list for global MOS UI — metadata only; revenue numbers come per deployment API. */
export const MOS_GLOBAL_MARKET_CODES = ["CA", "SY", "AE"] as const;
