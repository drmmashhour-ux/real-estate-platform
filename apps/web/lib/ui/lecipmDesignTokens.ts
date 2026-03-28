/**
 * LECIPM design tokens — single reference for marketing + UI (Stripe-level consistency).
 * Prefer Tailwind classes that map to these values; use this object for charts, PDFs, or inline styles.
 */
export const lecipmDesignTokens = {
  color: {
    black: "#0B0B0B",
    card: "#121212",
    gold: "#D4AF37",
    green: "#22C55E",
    red: "#EF4444",
  },
} as const;

export type LecipmColorKey = keyof typeof lecipmDesignTokens.color;
