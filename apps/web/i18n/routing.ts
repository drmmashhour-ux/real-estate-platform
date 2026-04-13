import { defineRouting } from "next-intl/routing";

/**
 * Active URL locales (Arabic messages exist under `messages/ar.json` for future activation).
 * @see https://next-intl.dev/docs/routing
 */
export const routing = defineRouting({
  /** Canada: en/fr · Syria: ar (country segment selects market-specific rules). */
  locales: ["en", "fr", "ar"],
  defaultLocale: "en",
  /** Explicit `/en/...`, `/fr/...`, `/ar/...` for SEO and hreflang. */
  localePrefix: "always",
});
