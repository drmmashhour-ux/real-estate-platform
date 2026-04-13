/** Primary product / logo wordmark. */
export const PLATFORM_NAME = "LECIPM";

/** French luxury descriptor — use as a tagline under LECIPM, not merged with an en-dash. */
export const PLATFORM_CARREFOUR_NAME = "Le Carrefour Immobilier Prestige";

/** App shell name for the rent & resale hub (buyer/seller/broker workspaces) — distinct from BNHUB stays. */
export const PLATFORM_IMMOBILIER_HUB_NAME = "Immobilier Hub";

/** Mortgage, calculators, AI pricing, and customer finance tools — one hub entry. */
export const PLATFORM_FINANCIAL_HUB_NAME = "Financial Hub";

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
 * LECIPM logo / lockup palette — luxury real estate + AI; trust, precision, premium.
 * Use only these hues on wordmarks, favicon, map pins, and formal brand surfaces.
 */
export const LECIPM_IDENTITY_COLORS = {
  gold: "#D4AF37",
  black: "#000000",
  white: "#FFFFFF",
  softGold: "#C9A646",
} as const;

/**
 * Text wordmark fallback when image logo fails: elegant serif + letterspacing + canonical gold.
 * Pairs with `.lecipm-wordmark` in `globals.css` (Cormorant Garamond via `--font-serif`).
 */
export const platformBrandWordmarkClass = "lecipm-wordmark";

/**
 * Single solid gold for LECIPM + Le Carrefour Immobilier Prestige (no multi-stop gradient).
 * Use `text-premium-gold` / `border-premium-gold` elsewhere for the same hue.
 */
export const platformBrandGoldTextClass = "text-brand-gold";

/** @deprecated Use `platformBrandGoldTextClass` — same single gold. */
export const platformCarrefourGoldGradientClass = platformBrandGoldTextClass;
