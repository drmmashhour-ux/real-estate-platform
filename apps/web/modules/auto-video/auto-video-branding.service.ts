import type { LecipmBrandRules } from "./auto-video.types";

export const LUXURY_BRAND_RULES_V1: LecipmBrandRules = {
  id: "lecipm-luxury-v1",
  baseHex: "#000000",
  charcoalHex: "#1A1A1A",
  goldHex: "#C9A227",
  goldSoftHex: "#D4AF37",
  endCardCta: "VISIT LECIPM.COM",
  fontHeadline: "Cormorant Garamond",
  fontBody: "Inter",
  logoPlacement: "both",
  safeAreaPct: { top: 10, bottom: 15, side: 5 },
};

export function getBrandingRules(): LecipmBrandRules {
  return LUXURY_BRAND_RULES_V1;
}
