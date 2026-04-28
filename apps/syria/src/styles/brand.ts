/**
 * Darlink brand tokens — JS mirror of CSS (`darlink-theme.css`) for programmatic use.
 * Fonts: ORDER SYBNB-86 — system-ui stack (same as `globals.css` / `darlink-theme.css`).
 */

export const brandColors = {
  /** Primary navy — shell, headings */
  navy: "#0F172A",
  /** Gold / sand — secondary highlights */
  gold: "#D6C3A1",
  /** Red accent — separators, badges, urgency */
  red: "#C7353A",
  redSoft: "#FB7185",
  /** Growth / positive actions (existing product accent) */
  accent: "#1F7A5C",
  offWhite: "#F8F6F2",
  surfaceMuted: "#EEF1F4",
} as const;

export const brandFonts = {
  arabic: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  english: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

export const brandShadows = {
  sm: "var(--darlink-shadow-sm)",
  md: "var(--darlink-shadow-md)",
  lg: "var(--darlink-shadow-lg)",
} as const;
