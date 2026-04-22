/**
 * LECIPM premium palette — gold for emphasis only; calm backgrounds.
 */

export const brand = {
  gold: "#D4AF37",
  goldDark: "#B8921E",
  goldSoft: "#F3E3A2",
  black: "#0B0B0B",
  charcoal: "#151515",
  softDark: "#1E1E1E",
  white: "#FFFFFF",
  offWhite: "#FAFAF7",
  lightGray: "#F2F2EE",
  midGray: "#D9D9D2",
  textGray: "#5C5C57",
} as const;

export const semantic = {
  success: "#2E8B57",
  warning: "#E0A800",
  danger: "#C73E1D",
  info: "#1F6FEB",
} as const;

/** Dashboard tone modifiers (CSS variable names — see design-system.css). */
export type DashboardTone = "residence" | "management" | "admin";

export const dashboardToneVars: Record<DashboardTone, Record<string, string>> = {
  residence: {
    "--ds-tone-surface": "#FAFAF7",
    "--ds-tone-accent-subtle": "rgba(212, 175, 55, 0.08)",
  },
  management: {
    "--ds-tone-surface": "#FFFFFF",
    "--ds-tone-accent-subtle": "rgba(21, 21, 21, 0.04)",
  },
  admin: {
    "--ds-tone-surface": "#151515",
    "--ds-tone-accent-subtle": "rgba(212, 175, 55, 0.12)",
  },
};
