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
  LECIPM_IDENTITY_COLORS,
  PLATFORM_OPERATOR,
  PLATFORM_COPYRIGHT_LINE,
  platformBrandGoldTextClass,
  platformBrandWordmarkClass,
} from "@/lib/brand/platform";

export {
  PLATFORM_NAME,
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_DEFAULT_DESCRIPTION,
  PLATFORM_DEFAULT_SITE_TITLE,
  PLATFORM_BRAND_GOLD_HEX,
  LECIPM_IDENTITY_COLORS,
  PLATFORM_OPERATOR,
  PLATFORM_COPYRIGHT_LINE,
  platformBrandGoldTextClass,
  platformBrandWordmarkClass,
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
  /** Strict identity palette — logo, favicon, formal lockups (`LECIPM_IDENTITY_COLORS`). */
  identity: LECIPM_IDENTITY_COLORS,
  primaryColor: LECIPM_IDENTITY_COLORS.gold,
  /** Optional soft gold highlight (same family as primary; use sparingly). */
  primaryHover: LECIPM_IDENTITY_COLORS.softGold,
  /** App shell backgrounds may use near-black for depth; logo lockup uses pure `identity.black`. */
  background: "#0B0B0B",
  surface: "#111111",
  surfaceLight: "#1A1A1A",
  textPrimary: LECIPM_IDENTITY_COLORS.white,
  textSecondary: "#A0A0A0",
} as const;

/** @deprecated Prefer `BRAND.background` — kept for imports that expect this export name. */
export const marketingPageBg = BRAND.background;

/** @deprecated Prefer `BRAND.primaryColor` */
export const accentGold = BRAND.primaryColor;
