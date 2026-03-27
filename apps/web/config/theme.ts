import { BRAND } from "@/config/branding";

/** Semantic color tokens — align with `app/globals.css` `:root` where applicable. */
export const COLORS = {
  primary: BRAND.primaryColor,
  primaryHover: BRAND.primaryHover,
  background: BRAND.background,
  surface: BRAND.surface,
  surfaceLight: BRAND.surfaceLight,
  border: "#2A2A2A",
  textPrimary: BRAND.textPrimary,
  textSecondary: BRAND.textSecondary,
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
} as const;

export const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "40px",
} as const;

export const RADIUS = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  xl: "24px",
} as const;

/** Marketing / dashboard shell — Tailwind-friendly strings + gradients. */
export const marketingTheme = {
  bg: COLORS.background,
  surface: "rgba(255,255,255,0.03)",
  surfaceElevated: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.1)",
  text: "#f8fafc",
  muted: "#94a3b8",
  accent: COLORS.primary,
  gradientHero:
    "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(201,166,70,0.15), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(201,166,70,0.08), transparent 50%)",
} as const;
