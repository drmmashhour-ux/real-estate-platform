/**
 * Marketing landing design tokens — mirrors `app/globals.css` `@theme` (`--color-landing-*`).
 * Use Tailwind classes (`bg-landing-black`, `text-landing-text`, …) in components; use this file when you need
 * hex values in JS (charts, inline SVG, emails).
 */
export const landingColorTokens = {
  black: "#000000",
  gold: "#D4AF37",
  dark: "#121212",
  gray: "#2A2A2A",
  text: "#EAEAEA",
} as const;

export const landingShadowTokens = {
  soft: "0 8px 32px rgb(0 0 0 / 0.45)",
  glow: "0 0 48px rgb(212 175 55 / 0.14)",
} as const;

/** Hero clamp — matches `--font-size-landing-hero` in globals.css */
export const landingTypography = {
  heroClamp: "clamp(2.25rem, 5vw + 1rem, 3.5rem)",
} as const;

export type LandingColorKey = keyof typeof landingColorTokens;
