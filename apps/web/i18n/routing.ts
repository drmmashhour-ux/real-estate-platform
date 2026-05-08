import { defineRouting } from "next-intl/routing";

/**
 * Active URL locales for production routing.
 *
 * Arabic (ar) is temporarily excluded from production routing to ensure
 * deployment stability. RTL layout, hydration, and voice assistant
 * integration require further testing before production activation.
 *
 * HOW TO RE-ENABLE ARABIC:
 * 1. Add "ar" back to the `locales` array below
 * 2. Verify RTL layout in all dashboard/admin pages (many use physical left/right)
 * 3. Test hydration: ensure dir="rtl" on <html> matches server and client
 * 4. Test voice recognition with lang="ar" (Web Speech API support varies)
 * 5. Run E2E scenario: e2e/scenarios/scenario-3-arabic-rtl.ts
 *
 * Arabic assets are preserved in:
 * - messages/ar.json (UI translations)
 * - lib/hub/core/hub-i18n.ts (hub section labels)
 * - lib/i18n/types.ts (locale metadata)
 * - modules/listing-assistant/listing-content.generator.ts (Arabic templates)
 *
 * @see https://next-intl.dev/docs/routing
 */
export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "fr",
  /** Explicit `/en/...`, `/fr/...` for SEO and hreflang. */
  localePrefix: "always",
});
