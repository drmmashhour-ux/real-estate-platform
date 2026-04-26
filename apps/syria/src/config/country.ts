/**
 * Darlink Syria — product boundary for `apps/syria` only.
 * Compliance, pricing, and monetization rules stay in-app (actions, modules), not in shared packages.
 */

export const COUNTRY_APP_CONFIG = {
  /** Must match APP_CONTEXT / assertDarlinkRuntimeEnv */
  appContext: "darlink",
  productKey: "darlink-syria",
  legalMarket: "SY",
  defaultCurrency: "SYP",
  defaultLocales: ["ar", "en"] as const,
} as const;

export type CountryAppConfig = typeof COUNTRY_APP_CONFIG;
