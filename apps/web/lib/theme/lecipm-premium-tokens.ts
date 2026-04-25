/**
 * LECIPM Premium — canonical values (mirrors `app/globals.css` @theme `--color-ds-*`).
 * Use for charts, inline styles, and tests; prefer Tailwind `bg-ds-bg`, `text-ds-gold`, etc. in components.
 */
export const LECIPM_PREMIUM = {
  background: "#000000",
  text: "#FFFFFF",
  gold: "#D4AF37",
  /** Secondary panel / card surface */
  surface: "#1a1a1a",
  border: "#2a2a2a",
} as const;

export type LecipmPremiumKey = keyof typeof LECIPM_PREMIUM;
