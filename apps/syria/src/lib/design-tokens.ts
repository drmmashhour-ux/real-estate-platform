/**
 * Hadiah Link — single source of truth for production UI (Syria: fast devices + slow networks).
 * Runtime styling uses `src/theme/darlink-theme.css` (`--darlink-*`); this file is the TypeScript contract.
 *
 * Performance rules: no heavy hero images, next/image q≈40–60, below-the-fold `content-visibility`,
 * avoid large shadows / blur / decorative motion (see `globals.css` + `hadiah-below-fold`).
 */
export const HADIAH_COLORS = {
  bg: "#0B0B0B",
  card: "#111111",
  border: "#2A2A2A",
  gold: "#D4AF37",
  red: "#DC2626",
  text: "#FFFFFF",
  muted: "#9CA3AF",
} as const;

/** Alias for product docs / external references */
export const COLORS = HADIAH_COLORS;

/** next/image quality for listing thumbnails (40–60 range; lower = smaller payload). */
export const LISTING_IMAGE_QUALITY = 45 as const;

/** Tap targets: min ~44px on primary actions (mobile-first). */
export const MIN_TAP = "2.75rem" as const;

export const HADIAH_BUTTONS = {
  /** Primary CTA — red */
  primary: { bg: HADIAH_COLORS.red, text: HADIAH_COLORS.text },
  /** Secondary — outline, no fill */
  secondary: { border: "1px solid " + HADIAH_COLORS.border, bg: "transparent" },
  /** Premium — gold ring on primary (e.g. مميز) */
  premium: { ring: HADIAH_COLORS.gold, bg: HADIAH_COLORS.red },
} as const;

export const HADIAH_CARDS = {
  radius: "1.25rem",
  border: "1px solid var(--darlink-border, rgba(15, 23, 42, 0.12))",
  /** Border + flat surface; no heavy elevation. */
  shadow: "none",
} as const;
