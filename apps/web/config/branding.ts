/**
 * Central brand core — single source for marketing + product.
 * Product/legal names remain in `@/lib/brand/platform`; `BRAND` is the design-system identity.
 */
import {
  PLATFORM_NAME,
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_DEFAULT_DESCRIPTION,
  PLATFORM_DEFAULT_SITE_TITLE,
  PLATFORM_BRAND_GOLD_HEX,
  PLATFORM_OPERATOR,
  PLATFORM_COPYRIGHT_LINE,
  platformBrandGoldTextClass,
} from "@/lib/brand/platform";

export {
  PLATFORM_NAME,
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_DEFAULT_DESCRIPTION,
  PLATFORM_DEFAULT_SITE_TITLE,
  PLATFORM_BRAND_GOLD_HEX,
  PLATFORM_OPERATOR,
  PLATFORM_COPYRIGHT_LINE,
  platformBrandGoldTextClass,
};

/** Canonical visual + naming tokens (landing, decks, UI shell). */
export const BRAND = {
  /** Full formal name — use in legal/deck; UI wordmark often uses `shortName`. */
  name: "Carrefour Immobilier Prestige Mashhour",
  /** Primary logo wordmark (matches product). */
  shortName: PLATFORM_NAME,
  /** French luxury line — pairs with `shortName` in subtitles. */
  carrefourLine: PLATFORM_CARREFOUR_NAME,
  tagline: "Buy • Sell • Rent • Finance — All in One System",
  primaryColor: "#C9A646",
  primaryHover: "#E0B84F",
  background: "#0B0B0B",
  surface: "#111111",
  surfaceLight: "#1A1A1A",
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0A0",
} as const;

/** @deprecated Prefer `BRAND.background` — kept for imports that expect this export name. */
export const marketingPageBg = BRAND.background;

/** @deprecated Prefer `BRAND.primaryColor` */
export const accentGold = BRAND.primaryColor;
