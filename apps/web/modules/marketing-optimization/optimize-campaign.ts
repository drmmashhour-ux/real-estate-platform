/**
 * Suggestion-only optimizer — wraps `generateMarketingCopy` / creatives without modifying the generator module.
 */
import {
  generateMarketingCopy,
  generateMarketingCreatives,
  type MarketingGeneratorInput,
} from "@/modules/marketing/marketing-generator.service";

export type OptimizeCampaignInput = {
  city: string;
  target: MarketingGeneratorInput["target"];
  tone: MarketingGeneratorInput["tone"];
};

export type OptimizeCampaignResult = {
  headlines: string[];
  descriptions: string[];
  posterHeadline: string;
  posterSubhead: string;
  posterCta: string;
};

/** Returns alternative copy blocks when performance is weak — human review required before use. */
export function optimizeCampaign(input: OptimizeCampaignInput): OptimizeCampaignResult {
  const base: MarketingGeneratorInput = {
    target: input.target,
    city: input.city,
    tone: input.tone,
    objective: "browse_listings",
  };
  const copy = generateMarketingCopy(base);
  const creative = generateMarketingCreatives(base);
  return {
    headlines: copy.headlines.slice(0, 5),
    descriptions: copy.descriptions.slice(0, 4),
    posterHeadline: creative.posterHeadline,
    posterSubhead: creative.posterSubhead,
    posterCta: creative.posterCta,
  };
}
