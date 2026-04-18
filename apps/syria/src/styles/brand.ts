/**
 * Darlink brand tokens — JS mirror of CSS (`darlink-theme.css`) for programmatic use.
 * Fonts: Cairo (Arabic), Inter (English) via next/font in `[locale]/layout.tsx`.
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
  arabic: "var(--font-darlink-cairo), Cairo, Noto Naskh Arabic, sans-serif",
  english: "var(--font-darlink-inter), Inter, system-ui, sans-serif",
} as const;

export const brandShadows = {
  sm: "var(--darlink-shadow-sm)",
  md: "var(--darlink-shadow-md)",
  lg: "var(--darlink-shadow-lg)",
} as const;
