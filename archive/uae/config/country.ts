/**
 * UAE product — boundary for `apps/uae` only.
 * No Canadian or Syria-specific business rules belong here.
 */

export const COUNTRY_APP_CONFIG = {
  /** Must match APP_CONTEXT / assertUaeRuntimeEnv */
  appContext: "uae",
  productKey: "uae-market",
  legalMarket: "AE",
  defaultCurrency: "AED",
  defaultLocales: ["ar", "en"] as const,
} as const;

export type CountryAppConfig = typeof COUNTRY_APP_CONFIG;
