/** Canonical hex — aligned with `app/globals.css` @theme + design-system.css */
export const colorTokens = {
  background: "#0B0B0B",
  surface: "#151515",
  card: "#1E1E1E",
  border: "#2A2A2A",
  gold: "#D4AF37",
  goldDark: "#B8921E",
  goldSoft: "#F3E3A2",
  goldMuted: "rgba(212,175,55,0.2)",
  textPrimary: "#FFFFFF",
  textSecondary: "#B0B0B0",
  offWhite: "#FAFAF7",
  lightGray: "#F2F2EE",
  midGray: "#D9D9D2",
  textGray: "#5C5C57",
  success: "#2E8B57",
  warning: "#E0A800",
  danger: "#C73E1D",
  info: "#1F6FEB",
} as const;

export type ColorTokenKey = keyof typeof colorTokens;

/** Re-export scale modules (palette: import from `./colors` or `@/design-system`). */
export { spacingPx, spacingClass } from "./spacing";
export { radii } from "./radii";
export { motion, easing } from "./motion";
export { shadows } from "./shadows";
export { animations } from "./animations";
