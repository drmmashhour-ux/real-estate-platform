/**
 * Darlink brand asset paths — `/public/brand/*`.
 * Raster assets are generated via `pnpm run brand:rasters` (requires devDependencies).
 */

import { DARLINK_THEME_NAMESPACE } from "@/theme/darlink-tokens";

export const darlinkBrand = {
  themeNamespace: DARLINK_THEME_NAMESPACE,
  englishName: "Darlink",
  arabicName: "دارلينك",

  /** Horizontal lockups (standalone SVG files; OG/email). */
  logoSvg: "/brand/darlink-logo.svg",
  logoDarkSvg: "/brand/darlink-logo-dark.svg",
  logoLightSvg: "/brand/darlink-logo-light.svg",

  /** Icon — no embedded text */
  iconSvg: "/brand/darlink-icon.svg",
  icon512: "/brand/darlink-icon.png",
  icon192: "/brand/darlink-icon-192.png",
  icon48: "/brand/darlink-icon-48.png",
  faviconIco: "/brand/darlink-favicon.ico",

  appleTouchIcon: "/brand/apple-touch-icon.png",

  /** OG / Twitter summary — 1200×630 PNG generated from darlink-og.svg */
  ogDefaultImage: "/brand/og-default.png",

  /** Deprecated aliases — kept for gradual migration */
  favicon16: "/brand/favicon-16.png",
  favicon32: "/brand/favicon-32.png",
  appIcon512: "/brand/darlink-icon.png",
  wordmarkAr: "/brand/darlink-logo.svg",
  wordmarkEn: "/brand/darlink-logo.svg",
} as const;

export type DarlinkBrand = typeof darlinkBrand;
