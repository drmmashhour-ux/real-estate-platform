/**
 * LECIPM Marketing Studio v1 — wraps deterministic `marketing-generator.service` for canvas copy.
 */
import {
  generateMarketingCopy,
  generateMarketingCreatives,
  type MarketingGeneratorInput,
  type MarketingTarget,
} from "@/modules/marketing/marketing-generator.service";

export type StudioAudience = "host" | "buyer" | "investor";

export type StudioGeneratedCopy = {
  headline: string;
  subhead: string;
  cta: string;
  body: string;
  hashtags: string[];
};

function toTarget(a: StudioAudience): MarketingTarget {
  return a;
}

export function generateStudioMarketingCopy(input: {
  city: string;
  audience: StudioAudience;
}): StudioGeneratedCopy {
  const base: MarketingGeneratorInput = {
    target: toTarget(input.audience),
    city: input.city.trim() || "Montréal",
    tone: input.audience === "host" ? "bnb" : "modern",
    objective: "browse_listings",
  };
  const creative = generateMarketingCreatives(base);
  const copy = generateMarketingCopy(base);
  return {
    headline: creative.posterHeadline,
    subhead: creative.posterSubhead,
    cta: creative.posterCta,
    body: copy.descriptions[0] ?? creative.listingPromotionBlurb,
    hashtags: copy.hashtags,
  };
}
