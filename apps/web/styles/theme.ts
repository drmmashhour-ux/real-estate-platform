import { landingColorTokens, landingShadowTokens, landingTypography } from "./tokens";

/**
 * Semantic theme for the high-conversion landing system (black + gold).
 * Prefer Tailwind tokens: `bg-landing-black`, `border-landing-gray`, `shadow-landing-soft`, `text-landing-text`.
 */
export const marketingLandingTheme = {
  colors: landingColorTokens,
  shadows: landingShadowTokens,
  typography: landingTypography,
  /** Tailwind class bundles for quick composition in edge cases */
  surfaces: {
    page: "bg-landing-black text-landing-text",
    sectionAlt: "bg-landing-dark",
    card: "border border-white/10 bg-landing-gray/40",
    goldRing: "ring-1 ring-premium-gold/20 border-premium-gold/35",
  },
} as const;
