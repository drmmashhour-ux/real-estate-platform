/**
 * Luxury mobile shell tokens — black / gold base for new screens and shell components.
 * Existing screens may still import `theme/colors`; converge gradually.
 */
export const theme = {
  colors: {
    background: "#000000",
    surface: "#0D0D0D",
    surface2: "#111111",
    border: "#222222",
    gold: "#D4AF37",
    goldSoft: "rgba(212,175,55,0.16)",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.60)",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 30,
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
} as const;
