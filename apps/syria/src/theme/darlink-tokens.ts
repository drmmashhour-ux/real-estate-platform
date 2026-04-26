/**
 * Darlink design tokens — namespace `darlink` only.
 * Mirrors CSS variables in darlink-theme.css (single source of semantic names).
 */

import { DARLINK_THEME_NAMESPACE } from "@/lib/brand/darlink-guardrails";

export { DARLINK_THEME_NAMESPACE };

/** Stable theme identifier — always `darlink` for this product lane. */
export const DARLINK_THEME_ID = "darlink";

export const darlinkColor = {
  navy: "#0F172A",
  sand: "#D6C3A1",
  gold: "#D6C3A1",
  red: "#C7353A",
  redSoft: "#FB7185",
  offWhite: "#F8F6F2",
  accent: "#1F7A5C",
} as const;

export const darlinkSpacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
} as const;

export const darlinkRadius = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.25rem",
  "3xl": "1.5rem",
  full: "9999px",
} as const;

export const darlinkShadow = {
  sm: "0 1px 2px rgb(15 23 42 / 0.06)",
  md: "0 4px 14px rgb(15 23 42 / 0.08)",
  lg: "0 12px 40px rgb(15 23 42 / 0.12)",
} as const;

/** Semantic roles — use in TS when needed; CSS variables are authoritative for components. */
export const darlinkSemantic = {
  bg: darlinkColor.navy,
  surface: darlinkColor.offWhite,
  surfaceMuted: "#EEF1F4",
  border: "rgb(15 23 42 / 0.12)",
  text: darlinkColor.navy,
  textMuted: "rgb(15 23 42 / 0.65)",
  accent: darlinkColor.accent,
  sand: darlinkColor.sand,
  success: darlinkColor.accent,
  warning: "#B45309",
} as const;
