/** Canonical hex + semantic names — mirrored in `app/globals.css` @theme (`ds-*`). */
export const colorTokens = {
  background: "#000000",
  surface: "#121212",
  card: "#1A1A1A",
  border: "#2A2A2A",
  gold: "#D4AF37",
  goldSoft: "rgba(212,175,55,0.2)",
  textPrimary: "#FFFFFF",
  textSecondary: "#B0B0B0",
} as const;

export type ColorTokenKey = keyof typeof colorTokens;
