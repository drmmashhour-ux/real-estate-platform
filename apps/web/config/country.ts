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
