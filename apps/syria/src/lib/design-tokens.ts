/**
 * Hadiah Link — single source of truth for production UI tokens (Syria: lightweight CSS).
 * Keep in sync with `src/theme/darlink-theme.css` (CSS vars drive runtime styling).
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

/** next/image default quality for remote-optimized images (40–60 range). */
export const LISTING_IMAGE_QUALITY = 50 as const;

/** Tap targets: prefer min 44px (WCAG) on primary actions. */
export const MIN_TAP = "2.75rem" as const;

export const HADIAH_BUTTONS = {
  /** Primary CTA */
  primary: { bg: HADIAH_COLORS.red, text: HADIAH_COLORS.text },
  /** Ghost / secondary: outline, no fill */
  secondary: { border: "1px solid " + HADIAH_COLORS.border, bg: "transparent" },
  /** Premium accent (e.g. featured, gold ring) */
  premium: { ring: HADIAH_COLORS.gold, bg: HADIAH_COLORS.red },
} as const;

export const HADIAH_CARDS = {
  radius: "1.25rem",
  border: "1px solid var(--darlink-border, rgba(15, 23, 42, 0.12))",
  /** Prefer border + flat surface over heavy box-shadow. */
  shadow: "0 1px 2px rgb(15 23 42 / 0.04)",
} as const;
