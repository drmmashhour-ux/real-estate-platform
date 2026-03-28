/** Primary product / logo wordmark. */
export const PLATFORM_NAME = "LECIPM";

/** French luxury descriptor — use as a tagline under LECIPM, not merged with an en-dash. */
export const PLATFORM_CARREFOUR_NAME = "Le Carrefour Immobilier Prestige";

/** Operator / legal entity (footer, copyright, legal copy). */
export const PLATFORM_OPERATOR = "Mashhour Investments";

/**
 * Default tab / OpenGraph title — one separator site-wide (pipe, not en-dash).
 * Child routes use `title: "Segment"` so the root template yields `Segment | LECIPM`.
 */
export const PLATFORM_DEFAULT_SITE_TITLE = "LECIPM | AI Real Estate Investment Platform";

/** Short meta description reused in layout and key pages. */
export const PLATFORM_DEFAULT_DESCRIPTION =
  "Analyze, compare, and track real estate investments with LECIPM";

/** Legal / schema: "LECIPM (Le Carrefour Immobilier Prestige)". */
export const PLATFORM_LEGAL_DISPLAY = `${PLATFORM_NAME} (${PLATFORM_CARREFOUR_NAME})`;

/** Footer line without year: "LECIPM · Mashhour Investments". */
export const PLATFORM_COPYRIGHT_LINE = `${PLATFORM_NAME} · ${PLATFORM_OPERATOR}`;

/** Matches `--color-premium-gold` in `app/globals.css` (#d4af37). */
export const PLATFORM_BRAND_GOLD_HEX = "#D4AF37";

/**
 * Single solid gold for LECIPM + Le Carrefour Immobilier Prestige (no multi-stop gradient).
 * Use `text-premium-gold` / `border-premium-gold` elsewhere for the same hue.
 */
export const platformBrandGoldTextClass = "text-brand-gold";

/** @deprecated Use `platformBrandGoldTextClass` — same single gold. */
export const platformCarrefourGoldGradientClass = platformBrandGoldTextClass;
